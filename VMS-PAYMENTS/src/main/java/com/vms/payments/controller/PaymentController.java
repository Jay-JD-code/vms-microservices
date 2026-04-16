package com.vms.payments.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vms.payments.dto.PaymentRequest;
import com.vms.payments.dto.PaymentResponse;
import com.vms.payments.entity.PaymentEntity;
import com.vms.payments.entity.PaymentStatus;
import com.vms.payments.service.PaymentService;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    private String getRole(HttpServletRequest request) {
        String role = request.getHeader("X-User-Role");
        if (role == null) {
            role = (String) request.getAttribute("role");
        }
        return role != null ? role : "ADMIN";
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PaymentRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(paymentService.createPayment(request, getRole(httpRequest)));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam PaymentStatus status,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(paymentService.updateStatus(id, status, getRole(httpRequest)));
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<?> getVendorPayments(@PathVariable UUID vendorId, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(paymentService.getVendorPayments(vendorId, getRole(httpRequest)));
    }
    
    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPayments(HttpServletRequest httpRequest) {
        String role = getRole(httpRequest);
        String vendorIdHeader = httpRequest.getHeader("X-Vendor-Id");
        
        if ("VENDOR".equals(role) && vendorIdHeader != null && !vendorIdHeader.isBlank()) {
            return ResponseEntity.ok(paymentService.getVendorPayments(UUID.fromString(vendorIdHeader), role));
        }
        
        return ResponseEntity.ok(paymentService.getAllPayments());
    }
}
