package com.vms.payments.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.vms.payments.client.OrderClient;
import com.vms.payments.client.VendorClient;
import com.vms.payments.context.TenantContext;
import com.vms.payments.dto.OrderResponse;
import com.vms.payments.dto.PaymentRequest;
import com.vms.payments.dto.PaymentResponse;
import com.vms.payments.dto.VendorResponse;
import com.vms.payments.entity.OrderStatus;
import com.vms.payments.entity.PaymentEntity;
import com.vms.payments.entity.PaymentStatus;
import com.vms.payments.repository.PaymentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderClient orderClient;
    private final VendorClient vendorClient;

    // ── UPDATED: scoped to org with role-based access for recording payment ──
    public PaymentResponse createPayment(PaymentRequest request, String role) {

        if (!canRecordPayment(role)) {
            throw new RuntimeException("Only Finance role can record payments");
        }

        Long orgId = TenantContext.getOrganizationId();

        OrderResponse order = orderClient.getOrder(request.getOrderId());

        if (!order.getStatus().equals("DELIVERED")) {
            throw new RuntimeException("Item not yet delivered");
        }

        // Check duplicate within org only
        paymentRepository.findByOrderIdAndOrganizationId(request.getOrderId(), orgId)
                .ifPresent(p -> {
                    throw new RuntimeException("Payment already exists for this order");
                });

        PaymentEntity payment = new PaymentEntity();
        payment.setOrderId(request.getOrderId());
        payment.setAmount(request.getAmount());
        payment.setMethod(request.getMethod());
        payment.setVendorId(order.getVendorId());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        payment.setOrganizationId(orgId); // ← scope to org

        PaymentEntity saved = paymentRepository.save(payment);

        // Mark invoice as SUBMITTED to vendor when payment is recorded
        try {
            orderClient.markInvoiceAsSubmitted(request.getOrderId());
        } catch (Exception e) {
            // Log but don't fail payment recording
        }

        return mapToResponse(saved);
    }

    // ── UPDATED: scoped to org with role-based access for complete/fail ──
    public PaymentEntity updateStatus(Long id, PaymentStatus status, String role) {

        if (!canUpdatePaymentStatus(role)) {
            throw new RuntimeException("Only Vendor and Admin roles can complete or fail payments");
        }

        Long orgId = TenantContext.getOrganizationId();

        // For VENDOR role, look up by ID only (vendors are global, no org scope)
        // For other roles, scope to organization
        PaymentEntity payment;
        if ("VENDOR".equals(role)) {
            payment = paymentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));
        } else {
            payment = paymentRepository.findByIdAndOrganizationId(id, orgId)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));
        }

        payment.setStatus(status);
        PaymentEntity updated = paymentRepository.save(payment);

        // Only update order status to COMPLETED for non-VENDOR roles
        // VENDOR role completes payment but order is already DELIVERED
        // Order status COMPLETED is set by ADMIN/PROCUREMENT only
        if (status == PaymentStatus.COMPLETED && !"VENDOR".equals(role)) {
            orderClient.updateOrderStatus(
                    payment.getOrderId(),
                    OrderStatus.COMPLETED
            );
        }

        return updated;
    }

    private boolean canRecordPayment(String role) {
        return "FINANCE".equals(role);
    }

    private boolean canUpdatePaymentStatus(String role) {
        return "ADMIN".equals(role) || "MASTER_ADMIN".equals(role) || "VENDOR".equals(role);
    }

    public List<PaymentResponse> getVendorPayments(UUID vendorId, String role) {
        // For VENDOR role, return payments for that vendor only (no org scope)
        if ("VENDOR".equals(role)) {
            return paymentRepository.findByVendorId(vendorId)
                    .stream()
                    .map(this::mapToResponse)
                    .toList();
        }

        Long orgId = TenantContext.getOrganizationId();
        return paymentRepository.findByVendorIdAndOrganizationId(vendorId, orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<PaymentResponse> getAllPayments() {
        Long orgId = TenantContext.getOrganizationId();

        return paymentRepository.findAllByOrganizationId(orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── Helper: extracted to avoid repetition ──
    private PaymentResponse mapToResponse(PaymentEntity payment) {

        String vendorName = "—";
        try {
            VendorResponse vendor = vendorClient.getVendor(payment.getVendorId());
            if (vendor != null && vendor.getCompanyName() != null) {
                vendorName = vendor.getCompanyName();
            }
        } catch (Exception e) {
            // vendor service unavailable — use default
        }

        PaymentResponse response = new PaymentResponse();
        response.setId(payment.getId());
        response.setOrderId(payment.getOrderId());
        response.setVendorId(payment.getVendorId());
        response.setAmount(payment.getAmount());
        response.setMethod(payment.getMethod());
        response.setStatus(payment.getStatus().name());
        response.setCreatedAt(payment.getCreatedAt());
        response.setVendorName(vendorName);

        return response;
    }
}