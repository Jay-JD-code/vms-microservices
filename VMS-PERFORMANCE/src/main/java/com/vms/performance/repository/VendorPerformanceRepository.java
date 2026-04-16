package com.vms.performance.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.vms.performance.entity.VendorPerformance;

public interface VendorPerformanceRepository extends JpaRepository<VendorPerformance, UUID> {

    // ── Multi-tenancy additions ──

    // Get all performance records for this org
    List<VendorPerformance> findAllByOrganizationId(Long organizationId);

    // Get performance by vendor id scoped to org
    Optional<VendorPerformance> findByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);

    // Check if performance record exists for vendor in this org
    boolean existsByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);
}