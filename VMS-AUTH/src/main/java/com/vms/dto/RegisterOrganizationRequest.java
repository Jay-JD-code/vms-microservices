package com.vms.dto;

import lombok.Data;

@Data
public class RegisterOrganizationRequest {
    private String orgName;   // "Acme Corporation"
    private String slug;      // "acme-corp"
    private String adminEmail;
}
