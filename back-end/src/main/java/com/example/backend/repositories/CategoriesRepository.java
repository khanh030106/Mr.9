package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.entities.Category;

public interface CategoriesRepository extends JpaRepository<Category, Long> {

    @Query("""
    SELECT c FROM Category c WHERE c.isDeleted = false\s
   \s""")
    public List<Category> getAllCategories();

        // --- ADMIN CATEGORY MANAGEMENT START: list/search helpers for admin APIs ---
        @Query("""
        SELECT c FROM Category c
        LEFT JOIN c.parentID p
        WHERE (:keyword IS NULL OR LOWER(CAST(c.categoryName AS string)) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
            AND (COALESCE(:includeDeleted, false) = true OR COALESCE(c.isDeleted, false) = false)
        """)
        Page<Category> findAdminCategories(
                        @Param("keyword") String keyword,
                        @Param("includeDeleted") Boolean includeDeleted,
                        Pageable pageable
        );

        Optional<Category> findByIdAndIsDeletedFalse(Long id);

        @Query("""
        SELECT c FROM Category c
        WHERE COALESCE(c.isDeleted, false) = false
          AND LOWER(CAST(c.categoryName AS string)) = LOWER(CAST(:categoryName AS string))
        """)
        Optional<Category> findByCategoryNameIgnoreCaseAndIsDeletedFalse(@Param("categoryName") String categoryName);

        @Query("""
        SELECT c FROM Category c
        WHERE COALESCE(c.isDeleted, false) = false
        ORDER BY c.categoryName ASC
        """)
        List<Category> findAllActiveOrderByName();

        @Query("""
        SELECT COUNT(bc) FROM Bookcategory bc
        JOIN bc.bookID b
        WHERE bc.categoryID.id = :categoryId
          AND COALESCE(b.isDeleted, false) = false
        """)
        long countNonDeletedBooksByCategoryId(@Param("categoryId") Long categoryId);
        // --- ADMIN CATEGORY MANAGEMENT END: list/search helpers for admin APIs ---
}
