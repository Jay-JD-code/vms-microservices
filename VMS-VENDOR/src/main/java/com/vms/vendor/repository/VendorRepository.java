package com.vms.vendor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.vms.vendor.entity.VendorEntity;
import com.vms.vendor.entity.VendorStatus;

@Repository
public interface VendorRepository extends JpaRepository<VendorEntity, UUID> {

    Optional<VendorEntity> findFirstByEmailIgnoreCase(String email);

    List<VendorEntity> findAllByStatus(VendorStatus status);

    boolean existsByEmailIgnoreCase(String email);

    Optional<VendorEntity> findByEmailIgnoreCase(String email);
}