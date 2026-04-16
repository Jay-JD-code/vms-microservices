package com.vms.orders.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vms.orders.context.TenantContext;
import com.vms.orders.dto.OrderItemResponse;
import com.vms.orders.dto.OrderRequest;
import com.vms.orders.dto.OrderResponse;
import com.vms.orders.dto.PageResponse;
import com.vms.orders.dto.VendorResponse;
import com.vms.orders.entity.Invoice;
import com.vms.orders.entity.OrderItem;
import com.vms.orders.entity.OrderStatus;
import com.vms.orders.entity.PurchaseOrder;
import com.vms.orders.repository.InvoiceRepository;
import com.vms.orders.repository.OrderRepository;
import com.vms.orders.service.InvoiceService;
import com.vms.orders.service.OrderService;
import com.vms.orders.client.VendorClient;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final InvoiceService invoiceService;
    private final OrderRepository orderRepository;
    private final VendorClient vendorClient;
    private final InvoiceRepository invoiceRepository;

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderDetails(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderDetails(id));
    }
    
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody OrderRequest request) {
        return ResponseEntity.ok(orderService.createOrder(request));
    }

    @GetMapping("/vendor/{vendorId}")
    public PageResponse<OrderResponse> getOrders(
            @PathVariable UUID vendorId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Boolean global,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        // Get role from header (set by gateway) or from request attribute
        String role = request.getHeader("X-User-Role");
        if (role == null) {
            role = (String) request.getAttribute("role");
        }
        
        Page<PurchaseOrder> orderPage;
        
        // If global=true or user is VENDOR, get orders across all organizations
        if (Boolean.TRUE.equals(global) || "VENDOR".equals(role)) {
            orderPage = orderService.getAllOrdersForVendor(vendorId, status, page, size);
        } else {
            orderPage = orderService.getVendorOrders(vendorId, status, page, size, role);
        }

        // 🔥 MAP ENTITY → DTO
        List<OrderResponse> content = orderPage.getContent().stream().map(order -> {

            OrderResponse res = new OrderResponse();
            res.setId(order.getId());
            res.setVendorId(order.getVendorId());
            res.setStatus(order.getStatus().name());
            res.setCreatedAt(order.getCreatedAt());
            res.setUpdatedAt(order.getUpdatedAt());
            res.setTotalAmount(order.getTotalAmount());
            
            // Fetch vendor name
            String vendorName = "—";
            try {
                VendorResponse vendor = vendorClient.getVendor(order.getVendorId());
                if (vendor != null && vendor.getCompanyName() != null) {
                    vendorName = vendor.getCompanyName();
                }
            } catch (Exception e) {
                // vendor service unavailable — use default
            }
            res.setVendorName(vendorName);

            // Map order items
            if (order.getItems() != null) {
                List<OrderItemResponse> items = order.getItems().stream().map(item -> {
                    OrderItemResponse itemRes = new OrderItemResponse();
                    itemRes.setProductName(item.getProductName());
                    itemRes.setQuantity(item.getQuantity());
                    itemRes.setPrice(item.getPrice());
                    return itemRes;
                }).toList();
                res.setItems(items);
            }

            return res;

        }).toList();

        // 🔥 BUILD PageResponse
        PageResponse<OrderResponse> response = new PageResponse<>();
        response.setContent(content);
        response.setTotalPages(orderPage.getTotalPages());
        response.setTotalElements(orderPage.getTotalElements());

        return response;
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status,
            HttpServletRequest request
    ) {
        String role = request.getHeader("X-User-Role");
        if (role == null) {
            role = (String) request.getAttribute("role");
        }
        return ResponseEntity.ok(orderService.updateStatus(id, status, role != null ? role : "ADMIN"));
    }
    
    @GetMapping
    public List<OrderResponse> getAllOrders() {
        return orderService.getAllOrders();
    }
    
    // TEST ENDPOINTS - Remove in production
    @PostMapping("/test/create")
    public ResponseEntity<?> createTestOrder() {
        UUID vendorId = UUID.fromString("d23f6a50-d3f9-439d-928f-50e85cfa4b9b"); // Food Panda
        Long orgId = 1L;
        
        PurchaseOrder order = new PurchaseOrder();
        order.setVendorId(vendorId);
        order.setOrganizationId(orgId);
        order.setStatus(OrderStatus.CREATED);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        
        List<OrderItem> items = new ArrayList<>();
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setProductName("Test Product");
        item.setQuantity(5);
        item.setPrice(100.0);
        items.add(item);
        
        order.setItems(items);
        order.setTotalAmount(500.0);
        
        PurchaseOrder saved = orderRepository.save(order);
        return ResponseEntity.ok("Test order created: " + saved.getId());
    }
    
    @PostMapping("/test/generate-invoice/{orderId}")
    public ResponseEntity<?> testGenerateInvoice(@PathVariable Long orderId) {
        try {
            var invoice = invoiceService.generateInvoiceForOrder(orderId);
            return ResponseEntity.ok("Invoice generated: " + invoice.getInvoiceNumber() + " (ID: " + invoice.getId() + ")");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PostMapping("/test/deliver/{orderId}")
    public ResponseEntity<?> testDeliverOrder(@PathVariable Long orderId) {
        try {
            var order = orderRepository.findById(orderId).orElseThrow(() -> new RuntimeException("Order not found"));
            order.setStatus(OrderStatus.DELIVERED);
            order.setUpdatedAt(LocalDateTime.now());
            orderRepository.save(order);
            
            // Try to generate invoice
            var invoice = invoiceService.generateInvoiceForOrder(orderId);
            return ResponseEntity.ok("Order delivered and invoice generated: " + invoice.getInvoiceNumber());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage() + "\n" + 
                (e.getCause() != null ? "Cause: " + e.getCause().getMessage() : ""));
        }
    }
    
    @GetMapping("/test/invoice/{orderId}")
    public ResponseEntity<?> testGetInvoice(@PathVariable Long orderId) {
        try {
            var invoice = invoiceService.getInvoiceByOrderId(orderId);
            return ResponseEntity.ok(invoice);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("No invoice found for order: " + orderId + " - " + e.getMessage());
        }
    }
    
    @GetMapping("/test/all-invoices")
    public ResponseEntity<?> testGetAllInvoices() {
        try {
            var invoices = invoiceRepository.findAll();
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PostMapping("/test/fix-all-invoice-status")
    public ResponseEntity<?> testFixAllInvoiceStatus(@RequestParam String status) {
        try {
            var invoices = invoiceRepository.findAll();
            int count = 0;
            for (var invoice : invoices) {
                if (invoice.getStatus() == null) {
                    invoice.setStatus(Invoice.InvoiceStatus.valueOf(status));
                    invoiceRepository.save(invoice);
                    count++;
                }
            }
            return ResponseEntity.ok("Fixed " + count + " invoices with status " + status);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
