package com.vms.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vendor_organization_requests")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VendorOrganizationRequest {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID vendorId;
    private String vendorEmail;
    private String vendorCompanyName;

    private Long organizationId;
    private String organizationName;
    private String organizationEmail;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    private String message;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime respondedAt;

    public enum RequestStatus {
        PENDING,
        ACCEPTED,
        DECLINED
    }
}
