package com.vms.orders.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vms.orders.entity.Invoice;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findAllByOrganizationId(Long organizationId);

    List<Invoice> findAllByVendorId(UUID vendorId);

    Optional<Invoice> findByOrderId(Long orderId);

    List<Invoice> findAllByOrganizationIdAndVendorId(Long organizationId, UUID vendorId);
}
