package com.vms.dashboard.dto;

import java.util.List;

import lombok.Data;

@Data
public class DashboardResponse {
    private KPIStats stats;
    private List<OrdersTrendDTO> ordersTrend;
    private List<VendorStatusDTO> vendorStatus;
    private List<VendorStatusDTO> paymentStatus;
	
}
