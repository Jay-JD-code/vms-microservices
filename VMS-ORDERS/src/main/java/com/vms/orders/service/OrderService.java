package com.vms.orders.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.vms.orders.client.VendorClient;
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
import com.vms.orders.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final VendorClient vendorClient;
    private final InvoiceService invoiceService;

    // ── UPDATED: scoped to org ──
    public PurchaseOrder createOrder(OrderRequest request) {

        Long orgId = TenantContext.getOrganizationId();

        PurchaseOrder order = new PurchaseOrder();
        order.setVendorId(request.getVendorId());
        order.setStatus(OrderStatus.CREATED);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setOrganizationId(orgId); // ← scope to org

        List<OrderItem> items = request.getItems().stream().map(item -> {
            OrderItem newItem = new OrderItem();
            newItem.setOrder(order);
            newItem.setProductName(item.getProductName());
            newItem.setQuantity(item.getQuantity());
            newItem.setPrice(item.getPrice());
            return newItem;
        }).toList();

        double total = items.stream()
                .mapToDouble(i -> i.getPrice() * i.getQuantity())
                .sum();

        order.setItems(items);
        order.setTotalAmount(total);

        return orderRepository.save(order);
    }

    // ── UPDATED: scoped to org ──
    public OrderResponse getOrderDetails(Long orderId) {

        Long orgId = TenantContext.getOrganizationId();

        PurchaseOrder order = orderRepository.findByIdAndOrganizationId(orderId, orgId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        return mapToResponse(order);
    }

    // ── UPDATED: scoped to org ──
    public Page<PurchaseOrder> getVendorOrders(
            UUID vendorId,
            OrderStatus status,
            int page,
            int size,
            String role) {

        Long orgId = TenantContext.getOrganizationId();

        Pageable pageable = PageRequest.of(
                page, size, Sort.by("createdAt").descending());

        // For VENDOR role, don't scope by organization
        if ("VENDOR".equals(role)) {
            if (status != null) {
                return orderRepository.findByVendorIdAndStatus(vendorId, status, pageable);
            }
            return orderRepository.findByVendorId(vendorId, pageable);
        }

        // For other roles, scope by organization
        if (status != null) {
            return orderRepository.findByVendorIdAndStatusAndOrganizationId(
                    vendorId, status, orgId, pageable);
        }

        return orderRepository.findByVendorIdAndOrganizationId(
                vendorId, orgId, pageable);
    }

    // ── UPDATED: scoped to org with role-based access ──
    public PurchaseOrder updateStatus(Long orderId, OrderStatus status, String role) {

        PurchaseOrder order;
        
        // For VENDOR role, find order by ID only (vendors are global, don't scope by org)
        if ("VENDOR".equals(role)) {
            order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
        } else {
            Long orgId = TenantContext.getOrganizationId();
            order = orderRepository.findByIdAndOrganizationId(orderId, orgId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));
        }

        if (!isValidTransition(order.getStatus(), status)) {
            throw new RuntimeException("Invalid status transition");
        }

        if (!canPerformTransition(order.getStatus(), status, role)) {
            throw new RuntimeException("You don't have permission to perform this action");
        }

        order.setStatus(status);
        order.setUpdatedAt(LocalDateTime.now());

        PurchaseOrder savedOrder = orderRepository.saveAndFlush(order);

        if (status == OrderStatus.DELIVERED) {
            log.info("Order {} marked as DELIVERED, attempting to generate invoice", orderId);
            try {
                Invoice invoice = invoiceService.generateInvoiceForOrder(orderId);
                log.info("Invoice {} generated for order {}", invoice != null ? invoice.getInvoiceNumber() : "null", orderId);
                invoiceService.sendInvoiceByOrderId(orderId);
                log.info("Invoice generated and sent successfully for order {}", orderId);
            } catch (Exception e) {
                log.error("CRITICAL: Failed to generate invoice for order {}: {}", orderId, e.getMessage(), e);
                // Rethrow to make the error visible - remove this after debugging
                throw new RuntimeException("Invoice generation failed for order " + orderId + ": " + e.getMessage(), e);
            }
        }

        return savedOrder;
    }

    // ── NEW: Get all orders for a vendor (across all organizations) ──
    public Page<PurchaseOrder> getAllOrdersForVendor(UUID vendorId, OrderStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        if (status != null) {
            return orderRepository.findByVendorIdAndStatus(vendorId, status, pageable);
        }
        
        return orderRepository.findByVendorId(vendorId, pageable);
    }

    private boolean canPerformTransition(OrderStatus current, OrderStatus next, String role) {
        boolean isAdmin = "ADMIN".equals(role) || "MASTER_ADMIN".equals(role);
        boolean isVendor = "VENDOR".equals(role);
        boolean isProcurement = "PROCUREMENT".equals(role);

        return switch (next) {
            case APPROVED -> isAdmin || isVendor;
            case SHIPPED -> isAdmin || isVendor;
            case DELIVERED -> isAdmin || isVendor;
            case COMPLETED -> isAdmin || isProcurement;
            case CANCELLED -> {
                if (isAdmin) yield true;
                if (isProcurement && current != OrderStatus.SHIPPED && current != OrderStatus.DELIVERED && current != OrderStatus.COMPLETED) yield true;
                yield false;
            }
            default -> isAdmin;
        };
    }

    // ── UPDATED: scoped to org ──
    public List<OrderResponse> getAllOrders() {

        Long orgId = TenantContext.getOrganizationId();

        return orderRepository.findAllByOrganizationId(orgId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ── UPDATED: scoped to org ──
    public PageResponse<OrderResponse> getVendorOrdersResponse(
            UUID vendorId,
            OrderStatus status,
            int page,
            int size) {

        Long orgId = TenantContext.getOrganizationId();

        Pageable pageable = PageRequest.of(
                page, size, Sort.by("createdAt").descending());

        Page<PurchaseOrder> orderPage;

        if (status != null) {
            orderPage = orderRepository.findByVendorIdAndStatusAndOrganizationId(
                    vendorId, status, orgId, pageable);
        } else {
            orderPage = orderRepository.findByVendorIdAndOrganizationId(
                    vendorId, orgId, pageable);
        }

        List<OrderResponse> content = orderPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        PageResponse<OrderResponse> res = new PageResponse<>();
        res.setContent(content);
        res.setTotalPages(orderPage.getTotalPages());
        res.setTotalElements(orderPage.getTotalElements());

        return res;
    }

    // ── Helper: no change, just extracted to avoid repetition ──
    private OrderResponse mapToResponse(PurchaseOrder order) {

        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setVendorId(order.getVendorId());
        response.setStatus(order.getStatus().name());
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());
        response.setTotalAmount(order.getTotalAmount());

        String vendorName = "—";
        try {
            VendorResponse vendor = vendorClient.getVendor(order.getVendorId());
            if (vendor != null && vendor.getCompanyName() != null) {
                vendorName = vendor.getCompanyName();
            }
        } catch (Exception e) {
            // vendor service unavailable — use default
        }
        response.setVendorName(vendorName);

        List<OrderItemResponse> items = order.getItems().stream().map(item -> {
            OrderItemResponse dto = new OrderItemResponse();
            dto.setProductName(item.getProductName());
            dto.setQuantity(item.getQuantity());
            dto.setPrice(item.getPrice());
            return dto;
        }).toList();

        response.setItems(items);

        return response;
    }

    private boolean isValidTransition(OrderStatus current, OrderStatus next) {
        return switch (current) {
            case CREATED   -> next == OrderStatus.APPROVED  || next == OrderStatus.CANCELLED;
            case APPROVED  -> next == OrderStatus.SHIPPED   || next == OrderStatus.CANCELLED;
            case SHIPPED   -> next == OrderStatus.DELIVERED;
            case DELIVERED -> next == OrderStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}