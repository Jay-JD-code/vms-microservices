package com.vms.dashboard.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "VMS-ORDERS", url = "http://localhost:8084")
public interface OrderClient {

    @GetMapping("/api/orders")
    List<Map<String, Object>> getOrders();
}