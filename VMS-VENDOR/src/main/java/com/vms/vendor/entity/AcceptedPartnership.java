package com.vms.vendor.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "accepted_partnerships", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"vendor_id", "organization_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcceptedPartnership {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "vendor_id", nullable = false)
    private UUID vendorId;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "organization_name", nullable = false)
    private String organizationName;

    @Column(nullable = false)
    private LocalDateTime acceptedAt;
}
