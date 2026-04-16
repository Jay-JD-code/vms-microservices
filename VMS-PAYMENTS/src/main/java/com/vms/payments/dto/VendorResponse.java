package com.vms.payments.dto;



import java.util.UUID;

import lombok.Data;

@Data
public class VendorResponse {

    private UUID id;
    private String companyName;
}
