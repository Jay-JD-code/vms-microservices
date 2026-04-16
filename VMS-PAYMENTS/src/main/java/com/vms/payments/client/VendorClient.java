package com.vms.payments.client;


import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.vms.payments.dto.VendorResponse;

// 🔥 Use service name from Eureka
@FeignClient(name = "VMS-VENDOR")
public interface VendorClient {

    @GetMapping("/api/vendors/{id}")
    VendorResponse getVendor(@PathVariable("id") UUID uuid);
}
