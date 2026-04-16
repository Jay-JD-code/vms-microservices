package com.vms.dashboard.client;

import java.util.List;
import java.util.Map;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import com.vms.dashboard.fallback.VendorClientFallback;

@FeignClient(name = "VMS-VENDOR", url = "http://localhost:8082", fallback = VendorClientFallback.class)
public interface VendorClient {

    @GetMapping("/api/vendors")
    List<Map<String, Object>> getVendors();
}
