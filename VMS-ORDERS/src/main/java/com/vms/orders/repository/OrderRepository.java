package com.vms.orders.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import com.vms.orders.entity.OrderStatus;
import com.vms.orders.entity.PurchaseOrder;

public interface OrderRepository extends JpaRepository<PurchaseOrder, Long> {

    // ── Original — keep as is ──
    Page<PurchaseOrder> findByVendorId(UUID vendorId, Pageable pageable);

    Page<PurchaseOrder> findByVendorIdAndStatus(
            UUID vendorId,
            OrderStatus status,
            Pageable pageable
    );

    // ── Multi-tenancy additions ──

    // Get all orders for this org
    List<PurchaseOrder> findAllByOrganizationId(Long organizationId);

    // Get order by id scoped to org — prevents cross-org access
    Optional<PurchaseOrder> findByIdAndOrganizationId(Long id, Long organizationId);

    // Get orders by vendor scoped to org
    Page<PurchaseOrder> findByVendorIdAndOrganizationId(
            UUID vendorId,
            Long organizationId,
            Pageable pageable
    );

    // Get orders by vendor and status scoped to org
    Page<PurchaseOrder> findByVendorIdAndStatusAndOrganizationId(
            UUID vendorId,
            OrderStatus status,
            Long organizationId,
            Pageable pageable
    );

    // Get orders by status scoped to org
    List<PurchaseOrder> findAllByOrganizationIdAndStatus(
            Long organizationId,
            OrderStatus status
    );
}