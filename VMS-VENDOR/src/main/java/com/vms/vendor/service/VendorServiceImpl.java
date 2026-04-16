package com.vms.vendor.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vms.vendor.client.EmailClient;
import com.vms.vendor.dto.request.VendorRequest;
import com.vms.vendor.dto.response.VendorResponse;
import com.vms.vendor.entity.VendorEntity;
import com.vms.vendor.entity.VendorStatus;
import com.vms.vendor.exception.ResourceNotFoundException;
import com.vms.vendor.repository.VendorRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class VendorServiceImpl implements VendorService {

    private final VendorRepository repository;
    private final ModelMapper mapper;
    private final EmailClient emailClient;

    @Override
    @Transactional
    public VendorResponse createVendor(VendorRequest request) {
        repository.findByEmailIgnoreCase(request.getEmail()).ifPresent(existing -> {
            if (existing.getStatus() != VendorStatus.REJECTED) {
                throw new RuntimeException(
                    "A vendor with email " + request.getEmail() + " already exists.");
            }
            log.info("Removing previous {} vendor record for {} before re-creating",
                    existing.getStatus(), request.getEmail());
            repository.delete(existing);
            repository.flush();
        });

        VendorEntity vendor = mapper.map(request, VendorEntity.class);
        vendor.setStatus(VendorStatus.PENDING);
        vendor.setCreatedAt(LocalDateTime.now());
        vendor = repository.save(vendor);
        log.info("Created self-registered vendor: {}", vendor.getCompanyName());

        return mapper.map(vendor, VendorResponse.class);
    }

    @Override
    public List<VendorResponse> getAllVendors() {
        return repository.findAll()
                .stream()
                .map(vendor -> mapper.map(vendor, VendorResponse.class))
                .toList();
    }

    @Override
    public VendorResponse approveVendor(UUID id) {
        VendorEntity vendor = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        vendor.setStatus(VendorStatus.APPROVED);
        repository.save(vendor);
        
        try {
            EmailClient.VendorApprovedRequest request = new EmailClient.VendorApprovedRequest();
            request.setEmail(vendor.getEmail());
            request.setCompanyName(vendor.getCompanyName());
            emailClient.sendVendorApprovedEmail(request);
            log.info("Approval email sent to vendor: {}", vendor.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send approval email to {}: {}", vendor.getEmail(), e.getMessage());
        }
        
        return mapper.map(vendor, VendorResponse.class);
    }

    @Override
    public VendorResponse rejectVendor(UUID id) {
        VendorEntity vendor = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        vendor.setStatus(VendorStatus.REJECTED);
        repository.save(vendor);
        return mapper.map(vendor, VendorResponse.class);
    }

    @Override
    public VendorResponse suspendVendor(UUID id) {
        VendorEntity vendor = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        vendor.setStatus(VendorStatus.SUSPENDED);
        repository.save(vendor);
        return mapper.map(vendor, VendorResponse.class);
    }

    @Override
    public VendorResponse getByEmail(String email) {
        VendorEntity vendor = repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Vendor not found for email: " + email));
        return mapper.map(vendor, VendorResponse.class);
    }

    @Override
    public VendorResponse getVendorById(UUID id) {
        VendorEntity vendor = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found"));
        return mapper.map(vendor, VendorResponse.class);
    }

    @Override
    public void deleteVendor(UUID id) {
        VendorEntity vendor = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found"));

        if (vendor.getStatus() != VendorStatus.REJECTED) {
            throw new RuntimeException(
                "Only REJECTED vendors can be deleted. Current status: " + vendor.getStatus());
        }

        repository.delete(vendor);
    }

    @Override
    public List<VendorResponse> getAllVendorsGlobal() {
        return getAllVendors();
    }
}
