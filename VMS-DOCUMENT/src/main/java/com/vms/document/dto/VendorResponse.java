package com.vms.document.dto;



import lombok.Data;
import java.util.UUID;

@Data
public class VendorResponse {

    private UUID id;
    private String companyName;
}