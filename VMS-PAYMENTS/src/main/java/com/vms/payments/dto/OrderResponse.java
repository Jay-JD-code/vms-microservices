package com.vms.payments.dto;

import java.util.UUID;

import lombok.Data;

@Data
public class OrderResponse {

    private Long id;
    private UUID vendorId;
    private String status;
}
