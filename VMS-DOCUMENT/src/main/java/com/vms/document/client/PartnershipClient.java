package com.vms.document.client;

import java.util.List;
import java.util.UUID;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.vms.document.dto.AcceptedPartnershipResponse;

@FeignClient(name = "vms-vendor", url = "${vendor.service.url:http://localhost:8082}")
public interface PartnershipClient {

    @GetMapping("/api/partnerships/org-vendor-ids")
    List<UUID> getAcceptedVendorIds(@RequestParam Long organizationId);
    
    @GetMapping("/api/partnerships/vendor-partnerships/{vendorId}")
    List<AcceptedPartnershipResponse> getAcceptedPartnershipsForVendor(@PathVariable UUID vendorId);
}
