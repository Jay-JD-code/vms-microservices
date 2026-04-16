package com.vms.payments.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "payments")
@Data
public class PaymentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long orderId;

    private UUID vendorId;

    private Double amount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String method; // UPI, BANK_TRANSFER

    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private Long organizationId;
}
