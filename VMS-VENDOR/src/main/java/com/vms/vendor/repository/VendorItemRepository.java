package com.vms.vendor.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vms.vendor.entity.VendorItem;

public interface VendorItemRepository extends JpaRepository<VendorItem, UUID> {

    List<VendorItem> findByVendorId(String vendorId);

    List<VendorItem> findByVendorIdAndAvailableTrue(String vendorId);
}
