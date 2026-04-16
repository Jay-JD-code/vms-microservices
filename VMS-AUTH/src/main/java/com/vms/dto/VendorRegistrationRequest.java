package com.vms.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VendorRegistrationRequest {

    @NotBlank
    private String companyName;

    private String contactPerson;

    @Email
    @NotBlank
    private String email;

    private String phone;

    private String address;

    @NotBlank
    private String password;
}
