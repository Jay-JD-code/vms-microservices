package com.vms.document.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "documents")
@Data
public class Document {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID vendorId;
    private Long organizationId;
    private String fileName;
    private String fileKey;
    private String documentType;
    private LocalDateTime uploadedAt;

    private String status = "PENDING";
}