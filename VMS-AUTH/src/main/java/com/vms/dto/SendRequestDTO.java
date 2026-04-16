package com.vms.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SendRequestDTO {

    @NotBlank(message = "Vendor ID is required")
    private String vendorId;

    private String message;
}
