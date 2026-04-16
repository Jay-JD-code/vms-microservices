package com.vms.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class VendorInfoDTO {
    private UUID id;
    private String companyName;
    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private String status;
    private LocalDateTime createdAt;
}
