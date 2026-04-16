package com.vms.orders.dto;

import java.util.List;
import java.util.UUID;

import com.vms.orders.entity.OrderItem;

import lombok.Data;

@Data
public class OrderRequest {

	private UUID vendorId;
	private List<OrderItem> items;
}
