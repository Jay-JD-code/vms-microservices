package com.vms.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vms.entity.VendorOrganizationRequest;
import com.vms.entity.VendorOrganizationRequest.RequestStatus;

@Repository
public interface VendorOrganizationRequestRepository extends JpaRepository<VendorOrganizationRequest, UUID> {

    List<VendorOrganizationRequest> findAllByVendorId(UUID vendorId);

    List<VendorOrganizationRequest> findAllByOrganizationId(Long organizationId);

    List<VendorOrganizationRequest> findAllByVendorIdAndStatus(UUID vendorId, RequestStatus status);

    List<VendorOrganizationRequest> findAllByOrganizationIdAndStatus(Long organizationId, RequestStatus status);

    Optional<VendorOrganizationRequest> findByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);

    boolean existsByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);
}
