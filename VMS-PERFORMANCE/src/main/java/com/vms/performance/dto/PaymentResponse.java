package com.vms.performance.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class PaymentResponse {
    private Long orderId;
    private String status;
    private LocalDateTime createdAt;
}
