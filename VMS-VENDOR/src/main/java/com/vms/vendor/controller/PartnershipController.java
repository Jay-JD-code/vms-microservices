package com.vms.vendor.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vms.vendor.dto.request.AcceptPartnershipRequest;
import com.vms.vendor.dto.response.VendorResponse;
import com.vms.vendor.entity.AcceptedPartnership;
import com.vms.vendor.service.PartnershipService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/partnerships")
@RequiredArgsConstructor
public class PartnershipController {

    private final PartnershipService partnershipService;

    @PostMapping("/accept")
    public ResponseEntity<AcceptedPartnership> acceptPartnership(@RequestBody AcceptPartnershipRequest request) {
        AcceptedPartnership partnership = partnershipService.acceptPartnership(
                request.getVendorId(),
                request.getOrganizationId(),
                request.getOrganizationName()
        );
        return ResponseEntity.ok(partnership);
    }

    @PostMapping("/remove")
    public ResponseEntity<Void> removePartnership(
            @RequestParam UUID vendorId,
            @RequestParam Long organizationId) {
        partnershipService.removePartnership(vendorId, organizationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vendors-for-org")
    public ResponseEntity<List<Map<String, Object>>> getVendorsForOrganization(@RequestParam Long organizationId) {
        List<VendorResponse> vendors = partnershipService.getVendorsForOrganization(organizationId);
        List<Map<String, Object>> result = vendors.stream()
                .map(v -> Map.<String, Object>of(
                        "id", v.getId(),
                        "companyName", v.getCompanyName() != null ? v.getCompanyName() : "",
                        "contactPerson", v.getContactPerson() != null ? v.getContactPerson() : "",
                        "email", v.getEmail() != null ? v.getEmail() : "",
                        "phone", v.getPhone() != null ? v.getPhone() : "",
                        "address", v.getAddress() != null ? v.getAddress() : "",
                        "status", v.getStatus() != null ? v.getStatus().name() : "",
                        "createdAt", v.getCreatedAt() != null ? v.getCreatedAt().toString() : ""
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/vendor-partnerships")
    public ResponseEntity<List<AcceptedPartnership>> getVendorPartnerships(@RequestParam UUID vendorId) {
        return ResponseEntity.ok(partnershipService.getPartnershipsForVendor(vendorId));
    }

    @GetMapping("/vendor-partnerships/{vendorId}")
    public ResponseEntity<List<AcceptedPartnership>> getVendorPartnershipsById(@PathVariable UUID vendorId) {
        return ResponseEntity.ok(partnershipService.getPartnershipsForVendor(vendorId));
    }

    @GetMapping("/org-partnerships")
    public ResponseEntity<List<AcceptedPartnership>> getOrgPartnerships(@RequestParam Long organizationId) {
        return ResponseEntity.ok(partnershipService.getPartnershipsForOrganization(organizationId));
    }

    @GetMapping("/org-vendor-ids")
    public ResponseEntity<List<UUID>> getAcceptedVendorIds(@RequestParam Long organizationId) {
        List<AcceptedPartnership> partnerships = partnershipService.getPartnershipsForOrganization(organizationId);
        List<UUID> vendorIds = partnerships.stream()
                .map(AcceptedPartnership::getVendorId)
                .collect(Collectors.toList());
        return ResponseEntity.ok(vendorIds);
    }
}
