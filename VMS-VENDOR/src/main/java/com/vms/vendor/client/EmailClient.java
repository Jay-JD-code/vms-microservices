package com.vms.vendor.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "vms-auth", url = "${auth.service.url:http://localhost:8081}")
public interface EmailClient {

    @PostMapping("/api/emails/vendor-approved")
    void sendVendorApprovedEmail(@RequestBody VendorApprovedRequest request);

    class VendorApprovedRequest {
        private String email;
        private String companyName;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCompanyName() { return companyName; }
        public void setCompanyName(String companyName) { this.companyName = companyName; }
    }
}
