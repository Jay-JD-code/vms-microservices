package com.vms.vendor.client;



import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

import com.vms.vendor.dto.request.VendorRequest;

@FeignClient(name = "VMS-AUTH", url = "http://localhost:8081")
public interface AuthFeignClient {

    @PostMapping("/api/auth/create-vendor-user")
    void createVendorUser(@RequestBody Map<String, String> request);

    @PostMapping("/api/auth/register-vendor")
    void registerVendor(@RequestBody VendorRequest request);

}
