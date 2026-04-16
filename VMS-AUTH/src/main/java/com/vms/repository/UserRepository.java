package com.vms.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vms.entity.Role;
import com.vms.entity.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {

	
	
	
	
	boolean existsByEmail(String email);

	Optional<UserEntity> findByEmail(String email);
	
    // Find user by email within a specific org only
    Optional<UserEntity> findByEmailAndOrganizationId(String email, Long organizationId);

    // Get all users belonging to an org
    List<UserEntity> findAllByOrganizationId(Long organizationId);

    // Get users by role within an org (useful for notifying finance/procurement)
    List<UserEntity> findAllByOrganizationIdAndRole(Long organizationId, Role role);

    // Check if email exists within a specific org
    boolean existsByEmailAndOrganizationId(String email, Long organizationId);
}
