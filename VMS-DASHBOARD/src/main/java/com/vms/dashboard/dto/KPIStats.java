package com.vms.dashboard.dto;

import lombok.Data;

@Data
public class KPIStats {
    private long vendors;
    private long orders;
    private double payments;
    private double performance;
}
