package com.vms.document.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vms.document.client.PartnershipClient;
import com.vms.document.dto.AcceptedPartnershipResponse;
import com.vms.document.dto.VendorDocumentResponse;
import com.vms.document.entity.Document;
import com.vms.document.repository.DocumentRepository;
import com.vms.document.service.DocumentService;
import com.vms.document.service.S3Service;

import jakarta.servlet.http.HttpServletRequest;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    @Autowired private S3Service s3Service;
    @Autowired private DocumentService documentService;
    @Autowired private DocumentRepository repository;
    @Autowired private PartnershipClient partnershipClient;

    @PostMapping("/upload")
    public ResponseEntity<?> getUploadUrl(@RequestBody Map<String, String> req) {
        String fileName = req.get("fileName");
        String contentType = req.get("contentType");
        UUID vendorId = UUID.fromString(req.get("vendorId"));
        return ResponseEntity.ok(s3Service.generateUploadUrl(fileName, contentType, vendorId));
    }

    @PostMapping
    public ResponseEntity<?> saveMetadata(@RequestBody Map<String, String> req) {
        Long organizationId = Long.parseLong(req.get("organizationId"));
        Document doc = documentService.saveMetadata(
                UUID.fromString(req.get("vendorId")),
                organizationId,
                req.get("fileName"),
                req.get("fileKey"),
                req.get("docType")
        );
        return ResponseEntity.ok(doc);
    }

    @GetMapping
    public List<Document> getAll() {
        return repository.findAll();
    }

    @GetMapping("/vendor/{vendorId}")
    public ResponseEntity<List<Document>> getByVendor(@PathVariable UUID vendorId, HttpServletRequest request) {
        String role = request.getHeader("X-User-Role");
        String orgIdHeader = request.getHeader("X-Organization-Id");
        Long organizationId = orgIdHeader != null ? Long.parseLong(orgIdHeader) : null;
        return ResponseEntity.ok(documentService.getByVendor(vendorId, organizationId));
    }

    @GetMapping("/grouped")
    public List<VendorDocumentResponse> getGroupedDocs() {
        return documentService.getDocumentsGroupedByVendor();
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.approve(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable UUID id) {
        return ResponseEntity.ok(documentService.reject(id));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable UUID id) throws IOException {
        Document doc = documentService.getDocument(id);
        ResponseInputStream<GetObjectResponse> s3Object = s3Service.downloadFile(doc.getFileKey());
        String contentType = s3Service.getContentType(doc.getFileKey());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(new InputStreamResource(s3Object));
    }

    @GetMapping("/vendor-partnerships/{vendorId}")
    public ResponseEntity<List<AcceptedPartnershipResponse>> getVendorPartnerships(@PathVariable UUID vendorId) {
        return ResponseEntity.ok(partnershipClient.getAcceptedPartnershipsForVendor(vendorId));
    }

    @GetMapping("/org-partnership-vendors")
    public ResponseEntity<?> getPartnershipVendorsForOrg(HttpServletRequest request) {
        String orgIdHeader = request.getHeader("X-Organization-Id");
        if (orgIdHeader == null || orgIdHeader.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Organization ID required"));
        }
        Long organizationId = Long.parseLong(orgIdHeader);
        return ResponseEntity.ok(partnershipClient.getAcceptedVendorIds(organizationId));
    }
}