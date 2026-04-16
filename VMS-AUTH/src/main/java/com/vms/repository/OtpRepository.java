package com.vms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.vms.entity.OtpEntity;
import com.vms.entity.UserEntity;

@Repository
public interface OtpRepository extends JpaRepository<OtpEntity, Long> {

	Optional<OtpEntity> findByEmailAndOtp(String email, String otp);
	
	Optional<OtpEntity> findByEmail(String email);

	Optional<OtpEntity> findByResetToken(String resetToken);
}
