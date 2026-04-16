package com.vms.orders.dto;

import lombok.Data;

@Data
public class OrderItemResponse {

    private String productName;
    private Integer quantity;
    private Double price;
}
