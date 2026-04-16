package com.vms.document.dto;

import java.util.List;
import java.util.UUID;

import com.vms.document.entity.Document;

import lombok.Data;

@Data
public class VendorDocumentResponse {

    private UUID vendorId;
    private String vendorName;
    private List<Document> documents;
	
}
