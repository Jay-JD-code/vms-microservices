package com.vms.document.repository;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.vms.document.entity.Document;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByVendorId(UUID vendorId);
    
    List<Document> findByVendorIdAndOrganizationId(UUID vendorId, Long organizationId);
    
    List<Document> findByOrganizationId(Long organizationId);
}
