package com.vms.performance.client;

import java.util.List;
import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.vms.performance.dto.OrderResponse;
import com.vms.performance.dto.PageResponse;

@FeignClient(name = "VMS-ORDERS", url = "${vms.orders.url:http://localhost:8084}")
public interface OrderClient {

    @GetMapping("/api/orders/vendor/{vendorId}")
    PageResponse<OrderResponse> getOrders(@PathVariable UUID vendorId);
}