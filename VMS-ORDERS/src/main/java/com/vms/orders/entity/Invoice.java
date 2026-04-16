package com.vms.orders.entity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "invoices")
@Data
public class Invoice {

    @Id
    @GeneratedValue
    private Long id;

    private String invoiceNumber;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private UUID vendorId;

    private String vendorName;
    private String vendorEmail;
    private String vendorAddress;

    private String organizationName;
    private String organizationEmail;
    private String organizationAddress;

    private Double subtotal;
    private Double tax;
    private Double total;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;

    private LocalDateTime issuedAt;
    private LocalDateTime dueDate;
    private LocalDateTime paidAt;

    @JsonIgnoreProperties("invoice")
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InvoiceItem> items;

    @Column(nullable = false)
    private Long organizationId;

    public enum InvoiceStatus {
    	SENT,
        PENDING,      // Just generated, awaiting approval
        APPROVED,    // Approved by Admin/Procurement
        REJECTED,    // Rejected by Admin/Procurement
        SUBMITTED,   // Payment recorded, submitted to vendor
        PAID,
        OVERDUE,
        CANCELLED
    }
}
