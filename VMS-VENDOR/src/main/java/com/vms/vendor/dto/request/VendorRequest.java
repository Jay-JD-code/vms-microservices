package com.vms.vendor.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VendorRequest {

	@NotBlank
	private String companyName;
	
	private String contactPerson;
	
	@Email
	private String email;
	
	private String phone;
	
	private String address;
}
