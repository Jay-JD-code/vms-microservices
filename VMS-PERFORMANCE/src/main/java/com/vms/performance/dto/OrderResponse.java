package com.vms.performance.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class OrderResponse {
    /** Matches the 'id' field returned by VMS-ORDERS */
    private Long id;
    private UUID vendorId;
    private String status;
    private LocalDateTime createdAt;
    /** Timestamp of the last status change — used for accurate delivery-time measurement. */
    private LocalDateTime updatedAt;
}
