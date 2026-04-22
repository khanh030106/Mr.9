package com.example.backend.repositories;

import java.util.List;

import com.example.backend.entities.Userrole;
import com.example.backend.entities.UserroleId;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<Userrole, UserroleId> {
	// --- ADMIN USER MANAGEMENT START: replace user role assignment on create/update ---
	@Transactional
	void deleteByUserID_Id(Long userId);

	List<Userrole> findByUserID_Id(Long userId);
	// --- ADMIN USER MANAGEMENT END: replace user role assignment on create/update ---
}
