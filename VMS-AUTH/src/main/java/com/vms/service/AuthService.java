package com.vms.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.vms.client.VendorFeignClient;
import com.vms.context.TenantContext;
import com.vms.dto.LoginResponse;
import com.vms.dto.ChangePasswordRequest;
import com.vms.dto.ForgotPasswordRequest;
import com.vms.dto.LoginRequest;
import com.vms.dto.RegisterRequest;
import com.vms.dto.RegisterOrganizationRequest;
import com.vms.dto.ResetPasswordRequest;
import com.vms.dto.VerifyOtpRequest;
import com.vms.dto.VendorRegistrationRequest;
import com.vms.entity.OtpEntity;
import com.vms.entity.Organization;
import com.vms.entity.Role;
import com.vms.entity.UserEntity;
import com.vms.repository.OrganizationRepository;
import com.vms.repository.OtpRepository;
import com.vms.repository.UserRepository;
import com.vms.util.JwtUtil;
import com.vms.util.OtpUtility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpUtility utility;
    private final EmailService emailService;
    private final VendorFeignClient vendorFeignClient;

    // ── NEW: Register a brand new organization + first admin ──
    public LoginResponse registerOrganization(RegisterOrganizationRequest req) {

        // Check slug is unique
        if (organizationRepository.existsBySlug(req.getSlug())) {
            throw new RuntimeException("Organization slug already taken");
        }

        // Check admin email not already used globally
        if (userRepository.existsByEmail(req.getAdminEmail())) {
            throw new RuntimeException("An account with this email already exists");
        }

        // Create organization
        Organization org = Organization.builder()
                .name(req.getOrgName())
                .slug(req.getSlug())
                .plan(Organization.Plan.TRIAL)
                .active(true)
                .build();
        organizationRepository.save(org);

        // Create first admin user for this org
        String tempPassword = generatePassword();
        UserEntity admin = UserEntity.builder()
                .email(req.getAdminEmail())
                .password(passwordEncoder.encode(tempPassword))
                .role(Role.ADMIN)
                .is_first_login(true)
                .organization(org)
                .build();
        userRepository.save(admin);

        emailService.sendStaffCredentials(req.getAdminEmail(), req.getAdminEmail(), "ADMIN", tempPassword);

        // Return token so they can log in immediately
        String accessToken  = jwtUtil.generateAccessToken(admin.getEmail(), admin.getRole().name(), org.getId());
        String refreshToken = jwtUtil.generateRefreshToken(admin.getEmail());
        return new LoginResponse(accessToken, refreshToken, admin.getRole().name(), admin.getIs_first_login());
    }

    // ── UPDATED: registerStaff now scoped to current org ──
    public void registerStaff(RegisterRequest req) {

        Long orgId = TenantContext.getOrganizationId();

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        // Check duplicate within this org only
        if (userRepository.existsByEmailAndOrganizationId(req.getEmail(), orgId)) {
            throw new RuntimeException("An account with this email already exists in your organization");
        }

        Role role;
        try {
            role = Role.valueOf(req.getRole().toUpperCase());
        } catch (Exception e) {
            throw new RuntimeException("Invalid role. Only PROCUREMENT or FINANCE are allowed.");
        }

        if (role != Role.PROCUREMENT && role != Role.FINANCE) {
            throw new RuntimeException("Only PROCUREMENT or FINANCE staff can be registered.");
        }

        String tempPassword = generatePassword();

        UserEntity user = UserEntity.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(tempPassword))
                .role(role)
                .is_first_login(true)
                .organization(org)
                .build();
        userRepository.save(user);

        emailService.sendStaffCredentials(req.getEmail(), req.getEmail(), role.name(), tempPassword);
    }

    // ── UPDATED: login now includes organizationId in token ──
    public LoginResponse login(LoginRequest request) {

        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid Password");
        }

        Long orgId = user.getOrganization().getId();

        String accessToken  = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name(), orgId);
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return new LoginResponse(accessToken, refreshToken, user.getRole().name(), user.getIs_first_login());
    }

    // ── No change needed ──
    public void changePassword(ChangePasswordRequest req) {
        UserEntity user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        user.setIs_first_login(false);
        userRepository.save(user);
    }

    // ── No change needed ──
    public void forgotPassword(ForgotPasswordRequest request) {
        if (!userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User not found");
        }
        otpRepository.findByEmail(request.getEmail()).ifPresent(otpRepository::delete);
        String otp = utility.generateOtp();
        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setEmail(request.getEmail());
        otpEntity.setOtp(otp);
        otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(5));
        otpRepository.save(otpEntity);
        emailService.sendOtpEmail(request.getEmail(), otp);
    }

    // ── No change needed ──
    public String verifyOtp(VerifyOtpRequest request) {
        OtpEntity otpData = otpRepository
                .findByEmailAndOtp(request.getEmail(), request.getOtp())
                .orElseThrow(() -> new RuntimeException("Invalid OTP"));
        if (otpData.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }
        String resetToken = UUID.randomUUID().toString();
        otpData.setResetToken(resetToken);
        otpRepository.save(otpData);
        return resetToken;
    }

    // ── No change needed ──
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmNewPassword())) {
            throw new RuntimeException("Passwords do not match");
        }
        OtpEntity otpData = otpRepository
                .findByResetToken(request.getResetToken())
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));
        if (otpData.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token expired");
        }
        UserEntity user = userRepository.findByEmail(otpData.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        otpRepository.delete(otpData);
    }

    private String generatePassword() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    public LoginResponse registerVendor(VendorRegistrationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("An account with this email already exists");
        }

        String rawPassword = request.getPassword();
        
        Organization masterOrg = organizationRepository.findByIsMasterTrue()
                .orElseThrow(() -> new RuntimeException("Master organization not configured"));

        UserEntity vendorUser = UserEntity.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.VENDOR)
                .is_first_login(false)
                .organization(masterOrg)
                .build();
        userRepository.save(vendorUser);

        try {
            vendorFeignClient.createVendor(request);
            log.info("Created vendor record in VMS-VENDOR for {}", request.getEmail());
        } catch (Exception e) {
            log.error("Failed to create vendor record in VMS-VENDOR for {}: {}", request.getEmail(), e.getMessage());
        }

        emailService.sendVendorCredentials(request.getEmail());

        String accessToken  = jwtUtil.generateAccessToken(vendorUser.getEmail(), vendorUser.getRole().name(), masterOrg.getId());
        String refreshToken = jwtUtil.generateRefreshToken(vendorUser.getEmail());
        return new LoginResponse(accessToken, refreshToken, vendorUser.getRole().name(), vendorUser.getIs_first_login());
    }

    public void createMasterAdmin(RegisterOrganizationRequest req) {
        if (organizationRepository.existsBySlug(req.getSlug())) {
            throw new RuntimeException("Organization slug already taken");
        }

        if (userRepository.existsByEmail(req.getAdminEmail())) {
            throw new RuntimeException("An account with this email already exists");
        }

        Organization org = Organization.builder()
                .name(req.getOrgName())
                .slug(req.getSlug())
                .plan(Organization.Plan.ENTERPRISE)
                .active(true)
                .isMaster(true)
                .build();
        organizationRepository.save(org);

        String tempPassword = generatePassword();
        UserEntity masterAdmin = UserEntity.builder()
                .email(req.getAdminEmail())
                .password(passwordEncoder.encode(tempPassword))
                .role(Role.MASTER_ADMIN)
                .is_first_login(true)
                .organization(org)
                .build();
        userRepository.save(masterAdmin);

        emailService.sendStaffCredentials(req.getAdminEmail(), req.getAdminEmail(), "MASTER_ADMIN", tempPassword);
    }
}