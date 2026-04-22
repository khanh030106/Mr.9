package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.entities.Author;

public interface AuthorRepository extends JpaRepository<Author, Long> {
    // --- ADMIN BOOK MANAGEMENT START: load selected authors for book create/update ---
    List<Author> findByIdIn(List<Long> ids);

    Optional<Author> findTopByOrderByIdDesc();

    @Query("""
    SELECT a FROM Author a
    WHERE COALESCE(a.isDeleted, false) = false
      AND LOWER(CAST(a.authorName AS string)) = LOWER(CAST(:authorName AS string))
    """)
    Optional<Author> findByAuthorNameIgnoreCaseAndIsDeletedFalse(@Param("authorName") String authorName);

    @Query("""
    SELECT a FROM Author a
    WHERE COALESCE(a.isDeleted, false) = false
    ORDER BY a.authorName ASC
    """)
    List<Author> findAllActiveOrderByName();
    // --- ADMIN BOOK MANAGEMENT END: load selected authors for book create/update ---
}
