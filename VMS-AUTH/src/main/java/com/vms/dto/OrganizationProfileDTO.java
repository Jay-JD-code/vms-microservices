package com.vms.dto;

import lombok.Data;

@Data
public class OrganizationProfileDTO {
    private String name;
    private String description;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String website;
    private String industry;
    private String taxId;
    private String logoUrl;
    private String bankName;
    private String bankAccountNumber;
    private String bankIfscCode;
    private String contactPersonName;
    private String gstNumber;
}
