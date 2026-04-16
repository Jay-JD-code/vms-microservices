package com.vms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vms.service.EmailService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/vendor-approved")
    public ResponseEntity<Void> sendVendorApprovedEmail(@RequestBody VendorApprovedRequest request) {
        emailService.sendVendorApprovedEmail(request.getEmail(), request.getCompanyName());
        return ResponseEntity.ok().build();
    }

    public static class VendorApprovedRequest {
        private String email;
        private String companyName;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }
    }
}
