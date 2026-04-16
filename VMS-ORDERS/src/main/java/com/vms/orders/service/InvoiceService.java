package com.vms.orders.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vms.orders.client.VendorClient;
import com.vms.orders.context.TenantContext;
import com.vms.orders.dto.VendorResponse;
import com.vms.orders.entity.Invoice;
import com.vms.orders.entity.InvoiceItem;
import com.vms.orders.entity.OrderItem;
import com.vms.orders.entity.PurchaseOrder;
import com.vms.orders.repository.InvoiceRepository;
import com.vms.orders.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final OrderRepository orderRepository;
    private final VendorClient vendorClient;
    private static final double TAX_RATE = 0.18;

    @Transactional
    public Invoice generateInvoiceForOrder(Long orderId) {
        log.info("Starting invoice generation for order {}", orderId);
        
        // Check if invoice already exists
        var existingInvoice = invoiceRepository.findByOrderId(orderId);
        if (existingInvoice.isPresent()) {
            log.info("Invoice already exists for order {}: {}", orderId, existingInvoice.get().getInvoiceNumber());
            return existingInvoice.get();
        }

        log.info("No existing invoice found, creating new one for order {}", orderId);

        // Find order by ID only (vendor can generate invoice for orders addressed to them)
        PurchaseOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        
        log.info("Found order {} with {} items, vendorId: {}", orderId, 
                order.getItems() != null ? order.getItems().size() : 0, order.getVendorId());
        
        // Get orgId from the order itself
        Long orgId = order.getOrganizationId();
        log.info("Using organizationId: {} from order", orgId);

        VendorResponse vendor = null;
        try {
            vendor = vendorClient.getVendor(order.getVendorId());
        } catch (Exception e) {
            log.warn("Could not fetch vendor details for vendor {}", order.getVendorId());
        }

        String invoiceNumber = generateInvoiceNumber();

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setOrderId(orderId);
        invoice.setVendorId(order.getVendorId());
        invoice.setOrganizationId(orgId);

        if (vendor != null) {
            invoice.setVendorName(vendor.getCompanyName());
            invoice.setVendorEmail(vendor.getEmail());
            invoice.setVendorAddress(vendor.getAddress() != null ? vendor.getAddress() : "N/A");
        } else {
            invoice.setVendorName("Unknown Vendor");
            invoice.setVendorEmail("N/A");
            invoice.setVendorAddress("N/A");
        }

        invoice.setOrganizationName("Organization " + orgId);
        invoice.setOrganizationEmail("org" + orgId + "@example.com");
        invoice.setOrganizationAddress("Organization Address");

        List<InvoiceItem> invoiceItems = order.getItems().stream()
                .map(orderItem -> {
                    InvoiceItem item = new InvoiceItem();
                    item.setDescription(orderItem.getProductName());
                    item.setQuantity(orderItem.getQuantity());
                    item.setUnitPrice(orderItem.getPrice());
                    item.setTotal(orderItem.getPrice() * orderItem.getQuantity());
                    item.setInvoice(invoice);
                    return item;
                })
                .toList();

        invoice.setItems(invoiceItems);

        double subtotal = invoiceItems.stream().mapToDouble(InvoiceItem::getTotal).sum();
        invoice.setSubtotal(subtotal);
        invoice.setTax(subtotal * TAX_RATE);
        invoice.setTotal(subtotal + invoice.getTax());

        invoice.setStatus(Invoice.InvoiceStatus.SENT);
        invoice.setIssuedAt(LocalDateTime.now());
        invoice.setDueDate(LocalDateTime.now().plusDays(30));

        log.info("About to save invoice for order {} with {} items, total: {}", 
                orderId, invoiceItems.size(), invoice.getTotal());
        
        Invoice saved = invoiceRepository.save(invoice);
        log.info("SUCCESS: Generated invoice {} for order {} with status SENT, saved id: {}", 
                invoiceNumber, orderId, saved.getId());
        
        return saved;
    }

    @Transactional
    public Invoice approveInvoice(Long invoiceId) {
        Long orgId = TenantContext.getOrganizationId();
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        
        if (!invoice.getOrganizationId().equals(orgId)) {
            throw new RuntimeException("Invoice not found");
        }
        
        if (invoice.getStatus() != Invoice.InvoiceStatus.PENDING) {
            throw new RuntimeException("Invoice cannot be approved in current status: " + invoice.getStatus());
        }
        
        invoice.setStatus(Invoice.InvoiceStatus.APPROVED);
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice rejectInvoice(Long invoiceId) {
        Long orgId = TenantContext.getOrganizationId();
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        
        if (!invoice.getOrganizationId().equals(orgId)) {
            throw new RuntimeException("Invoice not found");
        }
        
        if (invoice.getStatus() != Invoice.InvoiceStatus.PENDING) {
            throw new RuntimeException("Invoice cannot be rejected in current status: " + invoice.getStatus());
        }
        
        invoice.setStatus(Invoice.InvoiceStatus.REJECTED);
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice markAsSubmitted(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
        
        if (invoice.getStatus() != Invoice.InvoiceStatus.APPROVED) {
            throw new RuntimeException("Invoice must be approved before submission");
        }
        
        invoice.setStatus(Invoice.InvoiceStatus.SUBMITTED);
        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public List<Invoice> getAllInvoicesNoFilter() {
        return invoiceRepository.findAll();
    }

    public List<Invoice> getInvoicesByVendor(UUID vendorId) {
        return invoiceRepository.findAllByVendorId(vendorId);
    }

    public Invoice getInvoiceById(Long id) {
        Long orgId = TenantContext.getOrganizationId();
        return invoiceRepository.findById(id)
                .filter(inv -> inv.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new RuntimeException("Invoice not found"));
    }

    public Invoice getInvoiceByOrderId(Long orderId) {
        return invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Invoice not found for order"));
    }

    @Transactional
    public Invoice markAsPaid(Long invoiceId) {
        Invoice invoice = getInvoiceById(invoiceId);
        invoice.setStatus(Invoice.InvoiceStatus.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice sendInvoice(Long invoiceId) {
        Invoice invoice = getInvoiceById(invoiceId);
        invoice.setStatus(Invoice.InvoiceStatus.SENT);
        log.info("Invoice {} sent to organization at {}", invoice.getInvoiceNumber(), invoice.getOrganizationEmail());
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice sendInvoiceByOrderId(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Invoice not found for order"));
        invoice.setStatus(Invoice.InvoiceStatus.SENT);
        log.info("Invoice {} sent for order {}", invoice.getInvoiceNumber(), orderId);
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice markAsSubmittedByOrderId(Long orderId) {
        Invoice invoice = invoiceRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Invoice not found for order"));
        
        if (invoice.getStatus() != Invoice.InvoiceStatus.APPROVED) {
            throw new RuntimeException("Invoice must be approved before submission");
        }
        
        invoice.setStatus(Invoice.InvoiceStatus.SUBMITTED);
        log.info("Invoice {} marked as SUBMITTED for order {}", invoice.getInvoiceNumber(), orderId);
        return invoiceRepository.save(invoice);
    }

    private String generateInvoiceNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String random = String.format("%04d", (int) (Math.random() * 10000));
        return "INV-" + date + "-" + random;
    }
}
