package com.vms.orders.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vms.orders.entity.Invoice;
import com.vms.orders.service.InvoiceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/generate/{orderId}")
    public ResponseEntity<Invoice> generateInvoice(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceService.generateInvoiceForOrder(orderId));
    }

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-Vendor-Id", required = false) String vendorId) {
        
        // For VENDOR role, only return their own invoices
        if ("VENDOR".equals(role) && vendorId != null && !vendorId.isBlank()) {
            return ResponseEntity.ok(invoiceService.getInvoicesByVendor(UUID.fromString(vendorId)));
        }
        
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<Invoice>> getInvoicesByVendor(@PathVariable UUID vendorId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByVendor(vendorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<Invoice> getInvoiceByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceService.getInvoiceByOrderId(orderId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Invoice> approveInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.approveInvoice(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Invoice> rejectInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.rejectInvoice(id));
    }

    @PutMapping("/{id}/paid")
    public ResponseEntity<Invoice> markAsPaid(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.markAsPaid(id));
    }

    @PutMapping("/{id}/send")
    public ResponseEntity<Invoice> sendInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.sendInvoice(id));
    }

    @PutMapping("/order/{orderId}/submitted")
    public ResponseEntity<Invoice> markAsSubmittedByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(invoiceService.markAsSubmittedByOrderId(orderId));
    }
}
