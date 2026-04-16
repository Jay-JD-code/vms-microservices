package com.vms.dto;

import lombok.Data;

@Data
public class ChangePasswordRequest {

	private String email;
	private String newPassword;
}
