package com.vms.vendor.dto.request;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AcceptPartnershipRequest {
    private UUID vendorId;
    private Long organizationId;
    private String organizationName;

}
