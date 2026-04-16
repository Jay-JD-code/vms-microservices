package com.vms.payments.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.vms.payments.entity.PaymentEntity;
import com.vms.payments.entity.PaymentStatus;

public interface PaymentRepository extends JpaRepository<PaymentEntity, Long> {

    // ── Original — keep as is ──
    Optional<PaymentEntity> findByOrderId(Long orderId);
    List<PaymentEntity> findByVendorId(UUID vendorId);

    // ── Multi-tenancy additions ──

    // Get all payments for this org
    List<PaymentEntity> findAllByOrganizationId(Long organizationId);

    // Get payment by id scoped to org
    Optional<PaymentEntity> findByIdAndOrganizationId(Long id, Long organizationId);

    // Get payments by vendor scoped to org
    List<PaymentEntity> findByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);

    // Get payments by order scoped to org
    Optional<PaymentEntity> findByOrderIdAndOrganizationId(Long orderId, Long organizationId);

    // Get payments by status scoped to org (useful for dashboard stats)
    List<PaymentEntity> findAllByOrganizationIdAndStatus(Long organizationId, PaymentStatus status);
}