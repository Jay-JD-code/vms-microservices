package com.vms.payments.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.vms.payments.dto.OrderResponse;
import com.vms.payments.entity.OrderStatus;

@FeignClient(name = "VMS-ORDERS", url = "http://localhost:8084")
public interface OrderClient {

    @GetMapping("/api/orders/{id}")
    OrderResponse getOrder(@PathVariable Long id);

    
    @PutMapping("/api/orders/{id}/status")
    void updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status
    );
    
    @PutMapping("/api/invoices/{orderId}/submitted")
    void markInvoiceAsSubmitted(@PathVariable Long orderId);
}