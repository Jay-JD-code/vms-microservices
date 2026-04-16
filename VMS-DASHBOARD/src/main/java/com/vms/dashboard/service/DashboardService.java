package com.vms.dashboard.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vms.dashboard.client.OrderClient;
import com.vms.dashboard.client.PaymentClient;
import com.vms.dashboard.client.PerformanceClient;
import com.vms.dashboard.client.VendorClient;
import com.vms.dashboard.context.TenantContext;
import com.vms.dashboard.dto.DashboardResponse;
import com.vms.dashboard.dto.KPIStats;
import com.vms.dashboard.dto.OrdersTrendDTO;
import com.vms.dashboard.dto.VendorStatusDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final VendorClient vendorClient;
    private final OrderClient orderClient;
    private final PaymentClient paymentClient;
    private final PerformanceClient performanceClient;

    // ── UPDATED: all downstream calls now carry org context via feign ──
    public DashboardResponse getDashboard() {

        Long orgId = TenantContext.getOrganizationId();
        log.info("Fetching dashboard for organizationId={}", orgId);

        // Each client call goes to a service that already filters by org
        // via TenantInterceptor — no changes needed in the clients themselves
        List<Map<String, Object>> vendors     = vendorClient.getVendors();
        List<Map<String, Object>> orders      = orderClient.getOrders();
        List<Map<String, Object>> payments    = paymentClient.getPayments();
        List<Map<String, Object>> performance = performanceClient.getPerformance();

        DashboardResponse response = new DashboardResponse();

        // ── KPI Stats ──
        KPIStats stats = new KPIStats();
        stats.setVendors(vendors.size());
        stats.setOrders(orders.size());
        stats.setPayments(calculateTotalPayments(payments));
        stats.setPerformance(calculateAvgPerformance(performance));
        response.setStats(stats);

        // ── Vendor Status breakdown ──
        Map<String, Long> statusMap = vendors.stream()
                .collect(Collectors.groupingBy(
                        v -> (String) v.get("status"),
                        Collectors.counting()
                ));
        response.setVendorStatus(
                statusMap.entrySet().stream()
                        .map(e -> new VendorStatusDTO(e.getKey(), e.getValue()))
                        .collect(Collectors.toList())
        );

        // ── Orders Trend by month ──
        Map<String, Long> ordersByMonth = orders.stream()
                .filter(o -> o.get("createdAt") != null)
                .collect(Collectors.groupingBy(
                        o -> extractMonth((String) o.get("createdAt")),
                        Collectors.counting()
                ));
        response.setOrdersTrend(
                ordersByMonth.entrySet().stream()
                        .sorted(Map.Entry.comparingByKey())
                        .map(e -> new OrdersTrendDTO(e.getKey(), e.getValue()))
                        .collect(Collectors.toList())
        );

        // ── Payment Status breakdown ──
        Map<String, Long> paymentStatus = payments.stream()
                .collect(Collectors.groupingBy(
                        p -> (String) p.get("status"),
                        Collectors.counting()
                ));
        response.setPaymentStatus(
                paymentStatus.entrySet().stream()
                        .map(e -> new VendorStatusDTO(e.getKey(), e.getValue()))
                        .collect(Collectors.toList())
        );

        return response;
    }

    // ── Sum of all payment amounts for KPI ──
    private double calculateTotalPayments(List<Map<String, Object>> payments) {
        return payments.stream()
                .mapToDouble(p -> {
                    Object val = p.get("amount");
                    if (val == null) return 0.0;
                    return Double.parseDouble(val.toString());
                })
                .sum();
    }

    // ── Average overall score across all vendors ──
    private double calculateAvgPerformance(List<Map<String, Object>> performance) {
        return performance.stream()
                .mapToDouble(p -> {
                    Object val = p.get("overallScore");
                    if (val == null) val = p.get("score");
                    if (val == null) return 0.0;
                    return Double.parseDouble(val.toString());
                })
                .average()
                .orElse(0.0);
    }

    private String extractMonth(String date) {
        if (date == null || date.length() < 7) return "Unknown";
        return date.substring(0, 7);
    }
}