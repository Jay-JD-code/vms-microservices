package com.vms.performance.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.vms.performance.client.OrderClient;
import com.vms.performance.client.PaymentClient;
import com.vms.performance.client.VendorClient;
import com.vms.performance.context.TenantContext;
import com.vms.performance.dto.OrderResponse;
import com.vms.performance.dto.PageResponse;
import com.vms.performance.dto.PaymentResponse;
import com.vms.performance.dto.VendorResponse;
import com.vms.performance.entity.VendorPerformance;
import com.vms.performance.repository.VendorPerformanceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorPerformanceService {

    private final VendorPerformanceRepository repository;
    private final OrderClient orderClient;
    private final PaymentClient paymentClient;
    private final VendorClient vendorClient;

    private static final long ON_TIME_DAYS = 7;

    // ── UPDATED: scoped to org ──
    public VendorPerformance calculatePerformance(UUID vendorId) {

        Long orgId = TenantContext.getOrganizationId();

        // Get orders - for VENDOR role, this will return all orders across organizations
        PageResponse<OrderResponse> page = orderClient.getOrders(vendorId);
        List<OrderResponse> orders = page.getContent();
        
        // Get payments - for VENDOR role, this should also be global
        List<PaymentResponse> payments = paymentClient.getPayments(vendorId);

        // ── ORDER BUCKETS ──
        int totalOrders = orders.size();

        List<OrderResponse> activeOrders = orders.stream()
                .filter(o -> !"CANCELLED".equals(o.getStatus()))
                .toList();

        List<OrderResponse> deliveredOrders = activeOrders.stream()
                .filter(o ->
                    "DELIVERED".equals(o.getStatus()) ||
                    "COMPLETED".equals(o.getStatus()))
                .toList();

        List<OrderResponse> completedOrders = activeOrders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()))
                .toList();

        long cancelledCount = orders.stream()
                .filter(o -> "CANCELLED".equals(o.getStatus()))
                .count();

        // ── METRIC 1: DELIVERY SCORE (40%) ──
        long onTimeCount = deliveredOrders.stream()
                .filter(o -> {
                    if (o.getCreatedAt() == null) return false;
                    LocalDateTime effectiveEnd = o.getUpdatedAt() != null
                            ? o.getUpdatedAt()
                            : LocalDateTime.now();
                    long days = ChronoUnit.DAYS.between(o.getCreatedAt(), effectiveEnd);
                    return days <= ON_TIME_DAYS;
                })
                .count();

        double deliveryScore = deliveredOrders.isEmpty()
                ? 100.0
                : (onTimeCount * 100.0 / deliveredOrders.size());

        // ── METRIC 2: QUALITY SCORE (25%) ──
        double qualityScore = deliveredOrders.isEmpty()
                ? 100.0
                : (completedOrders.size() * 100.0 / deliveredOrders.size());

        // ── METRIC 3: FULFILLMENT SCORE (20%) ──
        double fulfillmentScore = totalOrders == 0
                ? 100.0
                : ((totalOrders - cancelledCount) * 100.0 / totalOrders);

        // ── METRIC 4: COMPLIANCE SCORE (15%) ──
        int totalPayments = payments.size();
        long failedPayments = payments.stream()
                .filter(p -> "FAILED".equals(p.getStatus()))
                .count();

        double complianceScore = totalPayments == 0
                ? 100.0
                : ((totalPayments - failedPayments) * 100.0 / totalPayments);

        // ── OVERALL SCORE ──
        double overallScore =
                (deliveryScore    * 0.40) +
                (qualityScore     * 0.25) +
                (fulfillmentScore * 0.20) +
                (complianceScore  * 0.15);

        // ── AVERAGE DELIVERY TIME ──
        double avgDeliveryTime = deliveredOrders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .mapToLong(o -> {
                    LocalDateTime end = o.getUpdatedAt() != null
                            ? o.getUpdatedAt()
                            : LocalDateTime.now();
                    return ChronoUnit.HOURS.between(o.getCreatedAt(), end);
                })
                .average()
                .orElse(0);

        // ── VENDOR NAME ──
        String vendorName = "Unknown Vendor";
        try {
            VendorResponse vendor = vendorClient.getVendor(vendorId);
            log.info("Vendor response for {}: {}", vendorId, vendor);
            if (vendor != null && vendor.getCompanyName() != null) {
                vendorName = vendor.getCompanyName();
            }
        } catch (Exception e) {
            log.error("Failed to fetch vendor name for vendorId={}: {}",
                    vendorId, e.getMessage(), e);
        }

        // ── PERSIST: scoped to org ──
        // Find existing record for this vendor within this org
        VendorPerformance vp = repository
                .findByVendorIdAndOrganizationId(vendorId, orgId)
                .orElse(new VendorPerformance());

        vp.setVendorId(vendorId);
        vp.setVendorName(vendorName);
        vp.setOrganizationId(orgId); // ← scope to org

        vp.setTotalOrders(totalOrders);
        vp.setCompletedOrders(completedOrders.size());
        vp.setOnTimeDeliveries((int) onTimeCount);
        vp.setAverageDeliveryTime(avgDeliveryTime);

        vp.setDeliveryScore(deliveryScore);
        vp.setQualityScore(qualityScore);
        vp.setComplianceScore(complianceScore);
        vp.setFulfillmentScore(fulfillmentScore);
        vp.setOverallScore(overallScore);

        vp.setCalculatedAt(LocalDateTime.now());

        log.info("Scores for vendor {}: delivery={}, quality={}, fulfillment={}, compliance={}, overall={}",
                vendorId,
                String.format("%.1f", deliveryScore),
                String.format("%.1f", qualityScore),
                String.format("%.1f", fulfillmentScore),
                String.format("%.1f", complianceScore),
                String.format("%.1f", overallScore));

        return repository.save(vp);
    }

    // ── UPDATED: scoped to org ──
    public List<VendorPerformance> calculateAllPerformance() {

        Long orgId = TenantContext.getOrganizationId();

        // Only calculate for vendors belonging to this org
        List<UUID> vendorIds = vendorClient.getAllVendors()
                .stream()
                .map(VendorResponse::getId)
                .toList();

        return vendorIds.stream()
                .map(this::calculatePerformance)
                .toList();
    }

    // ── UPDATED: scoped to org ──
    public VendorPerformance getPerformance(UUID vendorId) {

        Long orgId = TenantContext.getOrganizationId();

        return repository.findByVendorIdAndOrganizationId(vendorId, orgId)
                .orElseGet(() -> {
                    log.info("No performance record found for vendor {} in org {} — calculating now",
                            vendorId, orgId);
                    return calculatePerformance(vendorId);
                });
    }

    // ── UPDATED: scoped to org ──
    public List<VendorPerformance> getAllPerformance() {

        Long orgId = TenantContext.getOrganizationId();

        return repository.findAllByOrganizationId(orgId);
    }
}