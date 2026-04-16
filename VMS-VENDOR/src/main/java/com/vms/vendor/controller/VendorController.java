package com.vms.vendor.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.vms.vendor.dto.request.VendorRequest;
import com.vms.vendor.dto.response.VendorResponse;
import com.vms.vendor.service.VendorService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService service;

    @PostMapping
    public ResponseEntity<VendorResponse> createVendor(@RequestBody VendorRequest request) {
        return ResponseEntity.ok(service.createVendor(request));
    }

    @GetMapping
    public ResponseEntity<List<VendorResponse>> getAllVendors() {
        return ResponseEntity.ok(service.getAllVendors());
    }

    
   
    @GetMapping("/me")
    public ResponseEntity<VendorResponse> getMyProfile(
            @RequestParam("email") String email) {

        return ResponseEntity.ok(service.getByEmail(email));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<VendorResponse> approveVendor(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveVendor(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<VendorResponse> rejectVendor(@PathVariable UUID id) {
        return ResponseEntity.ok(service.rejectVendor(id));
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<VendorResponse> suspendVendor(@PathVariable UUID id) {
        return ResponseEntity.ok(service.suspendVendor(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteVendor(@PathVariable UUID id) {
        service.deleteVendor(id);
        return ResponseEntity.ok("Vendor deleted successfully");
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorResponse> getVendorById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getVendorById(id));
    }

    @GetMapping("/all/global")
    public ResponseEntity<List<VendorResponse>> getAllVendorsGlobal() {
        return ResponseEntity.ok(service.getAllVendorsGlobal());
    }
}
