package com.example.backend.repositories;

import com.example.backend.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    @Query("""
    SELECT r FROM Role r  WHERE r.roleName = :roleName
    """)
    Optional<Role> findByRoleName(@Param("roleName") String roleName);
}
