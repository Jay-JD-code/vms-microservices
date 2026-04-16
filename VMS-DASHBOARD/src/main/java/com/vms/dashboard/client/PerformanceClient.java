package com.vms.dashboard.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "VMS-PERFORMANCE", url = "http://localhost:8086")
public interface PerformanceClient {

    @GetMapping("/api/performance")
    List<Map<String, Object>> getPerformance();
}
