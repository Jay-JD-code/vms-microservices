package com.vms.client;

import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.vms.dto.VendorInfoDTO;
import com.vms.dto.VendorRegistrationRequest;

@FeignClient(name = "VMS-VENDOR", url = "${vendor.service.url:http://localhost:8082}")
public interface VendorFeignClient {

    @PostMapping("/api/vendors")
    Object createVendor(@RequestBody VendorRegistrationRequest request);

    @GetMapping("/api/vendors/{id}")
    VendorInfoDTO getVendorById(@PathVariable("id") String id);

    @PostMapping("/api/partnerships/accept")
    Object acceptPartnership(@RequestBody AcceptPartnershipRequest request);

    public static class AcceptPartnershipRequest {
        private UUID vendorId;
        private Long organizationId;
        private String organizationName;

        public UUID getVendorId() { return vendorId; }
        public void setVendorId(UUID vendorId) { this.vendorId = vendorId; }
        public Long getOrganizationId() { return organizationId; }
        public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }
        public String getOrganizationName() { return organizationName; }
        public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }
    }
}
