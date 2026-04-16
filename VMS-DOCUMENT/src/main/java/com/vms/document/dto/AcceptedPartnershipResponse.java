package com.vms.document.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AcceptedPartnershipResponse {
    private Long organizationId;
    private String organizationName;
    private LocalDateTime acceptedAt;
}
