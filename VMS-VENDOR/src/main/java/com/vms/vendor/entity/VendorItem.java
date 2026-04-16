package com.vms.vendor.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "vendor_items")
@Data
public class VendorItem {

    @Id
    @GeneratedValue
    private UUID id;

    /** UUID of the owning vendor */
    @Column(nullable = false)
    private String vendorId;

    @Column(nullable = false)
    private String name;

    private String description;

    /** e.g. "piece", "kg", "box" */
    private String unit;

    private Double unitPrice;

    /** Vendor can toggle whether the item is currently available */
    private Boolean available = true;

    private LocalDateTime createdAt;
}
