package com.vms.performance.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "vendor_performance")
@Data
public class VendorPerformance {

    @Id
    private UUID vendorId;

    private String vendorName;   // ✅ ADD THIS

    private int totalOrders;
    private int completedOrders;
    private int onTimeDeliveries;

    private double averageDeliveryTime;

    // ✅ NEW FIELDS (FRONTEND EXPECTS THESE)
    private double deliveryScore;
    private double qualityScore;
    private double complianceScore;
    private double fulfillmentScore;
    private double overallScore;

    private LocalDateTime calculatedAt; // ✅ ADD THIS

    @Column(nullable = false)
    private Long organizationId;

}