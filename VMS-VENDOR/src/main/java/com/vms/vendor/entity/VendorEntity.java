package com.vms.vendor.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name="vendors")
@Data
public class VendorEntity {

	@Id
	@GeneratedValue
	private UUID id;
	
	private String companyName;
	
	private String contactPerson;
	
	private String email;
	
	private String phone;
	
	private String address;
	
	@Enumerated(EnumType.STRING)
	private VendorStatus status;
	
	private LocalDateTime createdAt;
}
