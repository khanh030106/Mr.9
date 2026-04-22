package com.example.backend.repositories;

import com.example.backend.entities.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = {"userRoles", "userRoles.roleID"})
    Optional<User> findByEmail(String email);

        // --- ADMIN USER MANAGEMENT START: list/filter helpers for admin APIs ---
        @EntityGraph(attributePaths = {"userRoles", "userRoles.roleID"})
        @Query("""
        SELECT DISTINCT u
        FROM User u
        LEFT JOIN u.userRoles ur
        LEFT JOIN ur.roleID r
        WHERE (:keyword IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))
            AND (:roleName IS NULL OR LOWER(r.roleName) = LOWER(:roleName))
            AND (:isActive IS NULL OR u.isActive = :isActive)
            AND (:isDeleted IS NULL OR u.isDeleted = :isDeleted)
        """)
        Page<User> findAdminUsers(
                        @Param("keyword") String keyword,
                        @Param("roleName") String roleName,
                        @Param("isActive") Boolean isActive,
                        @Param("isDeleted") Boolean isDeleted,
                        Pageable pageable
        );

        boolean existsByEmailIgnoreCase(String email);
        // --- ADMIN USER MANAGEMENT END: list/filter helpers for admin APIs ---

    boolean existsByEmail(String email);
}
