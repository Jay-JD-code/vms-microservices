package com.vms.dto;

import lombok.Data;

@Data
public class ResetPasswordRequest {

	private String resetToken;
	private String newPassword;
	private String confirmNewPassword;
}
