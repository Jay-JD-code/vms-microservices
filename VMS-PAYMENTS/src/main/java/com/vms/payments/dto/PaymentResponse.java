package com.vms.payments.dto;



import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class PaymentResponse {

    private Long id;

    private Long orderId;

    private UUID vendorId;

    private String vendorName; 

    private Double amount;

    private String method;

    private String status;

    private LocalDateTime createdAt;
}