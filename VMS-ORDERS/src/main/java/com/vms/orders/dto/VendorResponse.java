package com.vms.orders.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class VendorResponse {

    private UUID id;
    private String companyName;
    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private String status;
}