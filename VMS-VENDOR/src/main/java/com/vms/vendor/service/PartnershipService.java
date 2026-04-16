package com.vms.vendor.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vms.vendor.dto.response.VendorResponse;
import com.vms.vendor.entity.AcceptedPartnership;
import com.vms.vendor.entity.VendorEntity;
import com.vms.vendor.repository.AcceptedPartnershipRepository;
import com.vms.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnershipService {

    private final AcceptedPartnershipRepository partnershipRepository;
    private final VendorRepository vendorRepository;

    @Transactional
    public AcceptedPartnership acceptPartnership(UUID vendorId, Long organizationId, String organizationName) {
        if (partnershipRepository.existsByVendorIdAndOrganizationId(vendorId, organizationId)) {
            log.info("Partnership already exists for vendor {} and org {}", vendorId, organizationId);
            return partnershipRepository.findByVendorIdAndOrganizationId(vendorId, organizationId).orElse(null);
        }

        AcceptedPartnership partnership = AcceptedPartnership.builder()
                .vendorId(vendorId)
                .organizationId(organizationId)
                .organizationName(organizationName)
                .acceptedAt(LocalDateTime.now())
                .build();

        AcceptedPartnership saved = partnershipRepository.save(partnership);
        log.info("Created partnership: vendor {} with org {}", vendorId, organizationId);
        return saved;
    }

    @Transactional
    public void removePartnership(UUID vendorId, Long organizationId) {
        partnershipRepository.deleteByVendorIdAndOrganizationId(vendorId, organizationId);
        log.info("Removed partnership: vendor {} from org {}", vendorId, organizationId);
    }

    public List<VendorResponse> getVendorsForOrganization(Long organizationId) {
        List<AcceptedPartnership> partnerships = partnershipRepository.findAllByOrganizationId(organizationId);
        return partnerships.stream()
                .map(p -> vendorRepository.findById(p.getVendorId()))
                .filter(java.util.Optional::isPresent)
                .map(v -> mapToResponse(v.get()))
                .toList();
    }

    public List<AcceptedPartnership> getPartnershipsForVendor(UUID vendorId) {
        return partnershipRepository.findAllByVendorId(vendorId);
    }

    public List<AcceptedPartnership> getPartnershipsForOrganization(Long organizationId) {
        return partnershipRepository.findAllByOrganizationId(organizationId);
    }

    private VendorResponse mapToResponse(VendorEntity vendor) {
        VendorResponse response = new VendorResponse();
        response.setId(vendor.getId());
        response.setCompanyName(vendor.getCompanyName());
        response.setContactPerson(vendor.getContactPerson());
        response.setEmail(vendor.getEmail());
        response.setPhone(vendor.getPhone());
        response.setAddress(vendor.getAddress());
        response.setStatus(vendor.getStatus());
        response.setCreatedAt(vendor.getCreatedAt());
        return response;
    }
}
