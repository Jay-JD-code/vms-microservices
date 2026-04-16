package com.vms.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "organizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Plan plan = Plan.TRIAL;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isMaster = false;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String contactEmail;
    private String contactPhone;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String website;
    private String industry;
    
    @Column(name = "tax_id")
    private String taxId;
    
    private String logoUrl;
    
    private String bankName;
    @Column(name = "bank_account_number")
    private String bankAccountNumber;
    @Column(name = "bank_ifsc_code")
    private String bankIfscCode;
    
    @Column(name = "contact_person_name")
    private String contactPersonName;
    
    private String gstNumber;
    
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public enum Plan {
        TRIAL, BASIC, PRO, ENTERPRISE
    }
}
