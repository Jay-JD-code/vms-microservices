package com.vms.vendor.service;

import java.util.List;

import java.util.UUID;

import com.vms.vendor.dto.request.VendorRequest;
import com.vms.vendor.dto.response.VendorResponse;

public interface VendorService {

	VendorResponse createVendor(VendorRequest request);
	
	List<VendorResponse> getAllVendors();
	
	VendorResponse approveVendor(UUID id);

	VendorResponse rejectVendor(UUID id);

	VendorResponse suspendVendor(UUID id);
	
	VendorResponse getByEmail(String email);

	VendorResponse getVendorById(UUID id);

	void deleteVendor(UUID id);

	List<VendorResponse> getAllVendorsGlobal();
}
