package com.vms.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vms.dto.OrganizationProfileDTO;
import com.vms.dto.SendRequestDTO;
import com.vms.entity.Organization;
import com.vms.entity.VendorOrganizationRequest;
import com.vms.service.OrganizationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @GetMapping("/me")
    public ResponseEntity<Organization> getCurrentOrganization() {
        return ResponseEntity.ok(organizationService.getCurrentOrganization());
    }

    @PutMapping("/profile")
    public ResponseEntity<Organization> updateProfile(@RequestBody OrganizationProfileDTO dto) {
        return ResponseEntity.ok(organizationService.updateOrganizationProfile(dto));
    }

    @PostMapping("/request")
    public ResponseEntity<VendorOrganizationRequest> sendRequestToVendor(@Valid @RequestBody SendRequestDTO dto) {
        return ResponseEntity.ok(organizationService.sendRequestToVendor(dto.getVendorId(), dto.getMessage()));
    }

    @GetMapping("/requests/vendor/{vendorId}")
    public ResponseEntity<List<VendorOrganizationRequest>> getRequestsForVendor(@PathVariable UUID vendorId) {
        return ResponseEntity.ok(organizationService.getRequestsForVendor(vendorId));
    }

    @GetMapping("/requests/my")
    public ResponseEntity<List<VendorOrganizationRequest>> getMyRequests(@RequestParam UUID vendorId) {
        return ResponseEntity.ok(organizationService.getRequestsForVendor(vendorId));
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<VendorOrganizationRequest>> getPendingRequests(@RequestParam UUID vendorId) {
        return ResponseEntity.ok(organizationService.getPendingRequestsForVendor(vendorId));
    }

    @PutMapping("/requests/{requestId}/accept")
    public ResponseEntity<VendorOrganizationRequest> acceptRequest(
            @PathVariable UUID requestId,
            @RequestParam UUID vendorId) {
        return ResponseEntity.ok(organizationService.acceptRequest(requestId, vendorId));
    }

    @PutMapping("/requests/{requestId}/decline")
    public ResponseEntity<VendorOrganizationRequest> declineRequest(
            @PathVariable UUID requestId,
            @RequestParam UUID vendorId) {
        return ResponseEntity.ok(organizationService.declineRequest(requestId, vendorId));
    }

    @GetMapping  
    public ResponseEntity<List<Organization>> getAllOrganizations() {
        return ResponseEntity.ok(organizationService.getAllOrganizations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Organization> getOrganizationById(@PathVariable Long id) {
        return ResponseEntity.ok(organizationService.getOrganizationById(id));
    }

    @GetMapping("/accepted")
    public ResponseEntity<List<VendorOrganizationRequest>> getAcceptedRequests(@RequestParam UUID vendorId) {
        return ResponseEntity.ok(organizationService.getAcceptedRequestsForVendor(vendorId));
    }

    @GetMapping("/requests/sent")
    public ResponseEntity<List<VendorOrganizationRequest>> getSentRequests() {
        return ResponseEntity.ok(organizationService.getRequestsForCurrentOrganization());
    }
}
