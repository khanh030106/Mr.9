package com.example.backend.repositories;

import com.example.backend.entities.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoriesRepository extends JpaRepository<Category, Long> {

    @Query("""
    SELECT c FROM Category c WHERE c.isDeleted = false\s
   \s""")
    public List<Category> getAllCategories();

        // --- ADMIN CATEGORY MANAGEMENT START: list/search helpers for admin APIs ---
        @Query("""
        SELECT c FROM Category c
        LEFT JOIN c.parentID p
        WHERE (:keyword IS NULL OR LOWER(c.categoryName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            AND (COALESCE(:includeDeleted, false) = true OR COALESCE(c.isDeleted, false) = false)
        """)
        Page<Category> findAdminCategories(
                        @Param("keyword") String keyword,
                        @Param("includeDeleted") Boolean includeDeleted,
                        Pageable pageable
        );

        Optional<Category> findByIdAndIsDeletedFalse(Long id);

        @Query("""
        SELECT COUNT(bc) FROM Bookcategory bc
        WHERE bc.categoryID.id = :categoryId
        """)
        long countBooksByCategoryId(@Param("categoryId") Long categoryId);
        // --- ADMIN CATEGORY MANAGEMENT END: list/search helpers for admin APIs ---
}
