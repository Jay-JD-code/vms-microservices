package com.vms.orders.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.Data;

@Data
public class OrderResponse {

    private Long id;
    private UUID vendorId;
    private String vendorName;
    private String status;
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<OrderItemResponse> items;

	private Double totalAmount;
}
