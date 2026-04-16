package com.vms.vendor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vms.vendor.entity.AcceptedPartnership;

@Repository
public interface AcceptedPartnershipRepository extends JpaRepository<AcceptedPartnership, UUID> {

    List<AcceptedPartnership> findAllByOrganizationId(Long organizationId);

    Optional<AcceptedPartnership> findByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);

    boolean existsByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);

    void deleteByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);

    List<AcceptedPartnership> findAllByVendorId(UUID vendorId);
}
