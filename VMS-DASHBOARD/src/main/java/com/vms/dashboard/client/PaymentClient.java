package com.vms.dashboard.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "VMS-PAYMENTS", url = "http://localhost:8085")
public interface PaymentClient {

    @GetMapping("/api/payments")
    List<Map<String, Object>> getPayments();
}