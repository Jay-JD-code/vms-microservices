package com.vms.controller;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vms.context.TenantContext;
import com.vms.dto.ChangePasswordRequest;
import com.vms.dto.ForgotPasswordRequest;
import com.vms.dto.LoginRequest;
import com.vms.dto.LoginResponse;
import com.vms.dto.RefreshTokenRequest;
import com.vms.dto.RegisterOrganizationRequest;
import com.vms.dto.RegisterRequest;
import com.vms.dto.RegisterResponse;
import com.vms.dto.ResetPasswordRequest;
import com.vms.dto.TokenResponse;
import com.vms.dto.VerifyOtpRequest;
import com.vms.dto.VendorRegistrationRequest;
import com.vms.service.AuthService;
import com.vms.util.JwtUtil;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;
    private final AuthService service;

    // ── NEW: Register a brand new organization ──
    @PostMapping("/register-organization")
    public ResponseEntity<LoginResponse> registerOrganization(
            @RequestBody RegisterOrganizationRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.registerOrganization(request));
    }

    // ── No change needed ──
    @PostMapping("/register-staff")
    public ResponseEntity<RegisterResponse> registerStaff(
            @RequestBody RegisterRequest request) {
        service.registerStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse("Account created. Check your email for login credentials."));
    }

    // ── No change needed ──
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(service.login(request));
    }

    // ── No change needed ──
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        return ResponseEntity.ok("Logged out successfully");
    }

    // ── UPDATED: refresh token now carries organizationId ──
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        if (!jwtUtil.validateToken(refreshToken)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid refresh token");
        }
        String username = jwtUtil.extractUsername(refreshToken);
        String role     = jwtUtil.extractRole(refreshToken);
        Long   orgId    = TenantContext.getOrganizationId();
        String accessToken = jwtUtil.generateAccessToken(username, role, orgId);
        return ResponseEntity.ok(new TokenResponse(accessToken));
    }

    // ── No change needed ──
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        service.forgotPassword(request);
        return ResponseEntity.ok("OTP sent to email");
    }

    // ── No change needed ──
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        String resetToken = service.verifyOtp(request);
        return ResponseEntity.ok(Map.of("resetToken", resetToken));
    }

    // ── No change needed ──
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        service.resetPassword(request);
        return ResponseEntity.ok("Password updated successfully");
    }

    // ── No change needed ──
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest req) {
        service.changePassword(req);
        return ResponseEntity.ok("Password updated");
    }

    @PostMapping("/register-vendor")
    public ResponseEntity<LoginResponse> registerVendor(@RequestBody VendorRegistrationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.registerVendor(request));
    }

    @PostMapping("/create-master-admin")
    public ResponseEntity<RegisterResponse> createMasterAdmin(@RequestBody RegisterOrganizationRequest request) {
        service.createMasterAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterResponse("Master admin account created. Check your email for login credentials."));
    }
}