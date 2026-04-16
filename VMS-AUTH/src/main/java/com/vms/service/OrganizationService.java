package com.vms.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vms.client.VendorFeignClient;
import com.vms.context.TenantContext;
import com.vms.dto.OrganizationProfileDTO;
import com.vms.entity.Organization;
import com.vms.entity.VendorOrganizationRequest;
import com.vms.entity.VendorOrganizationRequest.RequestStatus;
import com.vms.entity.Role;
import com.vms.repository.OrganizationRepository;
import com.vms.repository.UserRepository;
import com.vms.repository.VendorOrganizationRequestRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final VendorOrganizationRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final VendorFeignClient vendorFeignClient;

    public Organization getCurrentOrganization() {
        Long orgId = TenantContext.getOrganizationId();
        if (orgId == null) {
            throw new RuntimeException("Organization ID not found in token. Please log in again.");
        }
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
    }

    @Transactional
    public Organization updateOrganizationProfile(OrganizationProfileDTO dto) {
        Organization org = getCurrentOrganization();
        
        if (dto.getName() != null) org.setName(dto.getName());
        if (dto.getDescription() != null) org.setDescription(dto.getDescription());
        if (dto.getContactEmail() != null) org.setContactEmail(dto.getContactEmail());
        if (dto.getContactPhone() != null) org.setContactPhone(dto.getContactPhone());
        if (dto.getAddress() != null) org.setAddress(dto.getAddress());
        if (dto.getCity() != null) org.setCity(dto.getCity());
        if (dto.getState() != null) org.setState(dto.getState());
        if (dto.getCountry() != null) org.setCountry(dto.getCountry());
        if (dto.getPostalCode() != null) org.setPostalCode(dto.getPostalCode());
        if (dto.getWebsite() != null) org.setWebsite(dto.getWebsite());
        if (dto.getIndustry() != null) org.setIndustry(dto.getIndustry());
        if (dto.getTaxId() != null) org.setTaxId(dto.getTaxId());
        if (dto.getLogoUrl() != null) org.setLogoUrl(dto.getLogoUrl());
        if (dto.getBankName() != null) org.setBankName(dto.getBankName());
        if (dto.getBankAccountNumber() != null) org.setBankAccountNumber(dto.getBankAccountNumber());
        if (dto.getBankIfscCode() != null) org.setBankIfscCode(dto.getBankIfscCode());
        if (dto.getContactPersonName() != null) org.setContactPersonName(dto.getContactPersonName());
        if (dto.getGstNumber() != null) org.setGstNumber(dto.getGstNumber());
        
        log.info("Organization profile updated for: {}", org.getName());
        return organizationRepository.save(org);
    }

    @Transactional
    public VendorOrganizationRequest sendRequestToVendor(String vendorIdStr, String message) {
        Long orgId = TenantContext.getOrganizationId();
        if (orgId == null) {
            throw new RuntimeException("Organization ID not found in token. Please log in again.");
        }
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        UUID vendorId = UUID.fromString(vendorIdStr);

        if (requestRepository.existsByVendorIdAndOrganizationId(vendorId, orgId)) {
            throw new RuntimeException("Request already sent to this vendor");
        }

        String vendorEmail = "Unknown";
        String vendorCompanyName = "Unknown Vendor";
        
        try {
            var vendorInfo = vendorFeignClient.getVendorById(vendorIdStr);
            if (vendorInfo != null) {
                vendorEmail = vendorInfo.getEmail() != null ? vendorInfo.getEmail() : vendorEmail;
                vendorCompanyName = vendorInfo.getCompanyName() != null ? vendorInfo.getCompanyName() : vendorCompanyName;
            }
        } catch (Exception e) {
            log.warn("Could not fetch vendor details for {}: {}", vendorId, e.getMessage());
        }

        String orgEmail = org.getContactEmail();
        if (orgEmail == null || orgEmail.isBlank()) {
            var admins = userRepository.findAllByOrganizationIdAndRole(orgId, Role.ADMIN);
            if (!admins.isEmpty()) {
                orgEmail = admins.get(0).getEmail();
            }
        }
        if (orgEmail == null || orgEmail.isBlank()) {
            orgEmail = org.getName().toLowerCase().replace(" ", "") + "@example.com";
        }

        VendorOrganizationRequest request = VendorOrganizationRequest.builder()
                .vendorId(vendorId)
                .vendorEmail(vendorEmail)
                .vendorCompanyName(vendorCompanyName)
                .organizationId(orgId)
                .organizationName(org.getName())
                .organizationEmail(orgEmail)
                .status(RequestStatus.PENDING)
                .message(message)
                .build();

        VendorOrganizationRequest saved = requestRepository.save(request);
        
        log.info("Request sent from organization {} to vendor {}", org.getName(), vendorCompanyName);
        
        return saved;
    }

    @Transactional
    public VendorOrganizationRequest acceptRequest(UUID requestId, UUID vendorId) {
        VendorOrganizationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getVendorId().equals(vendorId)) {
            throw new RuntimeException("You are not authorized to accept this request");
        }

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request is no longer pending");
        }

        request.setStatus(RequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        
        VendorOrganizationRequest saved = requestRepository.save(request);
        
        try {
            VendorFeignClient.AcceptPartnershipRequest partnershipRequest = new VendorFeignClient.AcceptPartnershipRequest();
            partnershipRequest.setVendorId(vendorId);
            partnershipRequest.setOrganizationId(request.getOrganizationId());
            partnershipRequest.setOrganizationName(request.getOrganizationName());
            vendorFeignClient.acceptPartnership(partnershipRequest);
            log.info("Created partnership in VENDOR service: vendor {} with org {}", vendorId, request.getOrganizationId());
        } catch (Exception e) {
            log.error("Failed to create partnership in VENDOR service: {}", e.getMessage());
        }
        
        log.info("Vendor {} accepted request from organization {}", request.getVendorCompanyName(), request.getOrganizationName());
        
        return saved;
    }

    @Transactional
    public VendorOrganizationRequest declineRequest(UUID requestId, UUID vendorId) {
        VendorOrganizationRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        if (!request.getVendorId().equals(vendorId)) {
            throw new RuntimeException("You are not authorized to decline this request");
        }

        if (request.getStatus() != RequestStatus.PENDING) {
            throw new RuntimeException("Request is no longer pending");
        }

        request.setStatus(RequestStatus.DECLINED);
        request.setRespondedAt(LocalDateTime.now());
        
        VendorOrganizationRequest saved = requestRepository.save(request);
        
        log.info("Vendor {} declined request from organization {}", request.getVendorCompanyName(), request.getOrganizationName());
        
        return saved;
    }

    public List<VendorOrganizationRequest> getRequestsForVendor(UUID vendorId) {
        return requestRepository.findAllByVendorId(vendorId);
    }

    public List<VendorOrganizationRequest> getPendingRequestsForVendor(UUID vendorId) {
        return requestRepository.findAllByVendorIdAndStatus(vendorId, RequestStatus.PENDING);
    }

    public List<VendorOrganizationRequest> getRequestsForOrganization(Long organizationId) {
        return requestRepository.findAllByOrganizationId(organizationId);
    }

    public List<VendorOrganizationRequest> getAcceptedRequestsForVendor(UUID vendorId) {
        return requestRepository.findAllByVendorIdAndStatus(vendorId, RequestStatus.ACCEPTED);
    }

    public List<VendorOrganizationRequest> getRequestsForCurrentOrganization() {
        Long orgId = TenantContext.getOrganizationId();
        return requestRepository.findAllByOrganizationId(orgId);
    }

    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    public Organization getOrganizationById(Long organizationId) {
        return organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
    }
}
