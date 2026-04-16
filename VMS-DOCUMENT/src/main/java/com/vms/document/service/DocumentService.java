package com.vms.document.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.vms.document.client.PartnershipClient;
import com.vms.document.client.VendorClient;
import com.vms.document.context.TenantContext;
import com.vms.document.dto.VendorDocumentResponse;
import com.vms.document.dto.VendorResponse;
import com.vms.document.entity.Document;
import com.vms.document.repository.DocumentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository repository;
    private final VendorClient vendorClient;
    private final PartnershipClient partnershipClient;
    private final S3Service s3Service;

    public Document saveMetadata(UUID vendorId, Long organizationId, String fileName,
                                  String fileKey, String docType) {
        Document doc = new Document();
        doc.setVendorId(vendorId);
        doc.setOrganizationId(organizationId);
        doc.setFileName(fileName);
        doc.setFileKey(fileKey);
        doc.setDocumentType(docType);
        doc.setUploadedAt(LocalDateTime.now());
        return repository.save(doc);
    }

    public List<Document> getByVendor(UUID vendorId, Long organizationId) {
        if (organizationId != null) {
            return repository.findByVendorIdAndOrganizationId(vendorId, organizationId);
        }
        return repository.findByVendorId(vendorId);
    }

    public Document approve(UUID id) {
        Document doc = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
        doc.setStatus("APPROVED");
        return repository.save(doc);
    }

    public Document reject(UUID id) {
        Document doc = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
        doc.setStatus("REJECTED");
        return repository.save(doc);
    }

    public Document getDocument(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found: " + id));
    }

    public List<VendorDocumentResponse> getDocumentsGroupedByVendor() {
        Long orgId = TenantContext.getOrganizationId();
        
        List<Document> allDocs;
        if (orgId != null) {
            allDocs = repository.findByOrganizationId(orgId);
        } else {
            allDocs = repository.findAll();
        }
        
        Set<UUID> acceptedVendorIds;
        if (orgId != null) {
            try {
                List<UUID> vendorIds = partnershipClient.getAcceptedVendorIds(orgId);
                acceptedVendorIds = Set.copyOf(vendorIds);
            } catch (Exception e) {
                log.warn("Could not fetch accepted partnerships: {}", e.getMessage());
                acceptedVendorIds = Set.of();
            }
        } else {
            acceptedVendorIds = null;
        }

        final Set<UUID> finalAcceptedVendorIds = acceptedVendorIds;
        List<Document> docs;
        if (finalAcceptedVendorIds != null && !finalAcceptedVendorIds.isEmpty()) {
            docs = allDocs.stream()
                    .filter(doc -> finalAcceptedVendorIds.contains(doc.getVendorId()))
                    .collect(Collectors.toList());
        } else {
            docs = allDocs;
        }

        Map<UUID, List<Document>> grouped =
                docs.stream().collect(Collectors.groupingBy(Document::getVendorId));

        return grouped.entrySet().stream().map(entry -> {
            UUID vendorId  = entry.getKey();
            String vendorName = "Unknown Vendor";
            try {
                VendorResponse vendor = vendorClient.getVendor(vendorId.toString());
                if (vendor != null && vendor.getCompanyName() != null) {
                    vendorName = vendor.getCompanyName();
                }
            } catch (Exception e) {
                log.warn("Vendor service unavailable for id: {}", vendorId);
            }

            VendorDocumentResponse res = new VendorDocumentResponse();
            res.setVendorId(vendorId);
            res.setVendorName(vendorName);
            res.setDocuments(entry.getValue());
            return res;
        }).toList();
    }
}