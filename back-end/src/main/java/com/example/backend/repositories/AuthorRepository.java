package com.example.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entities.Author;

public interface AuthorRepository extends JpaRepository<Author, Long> {
    // --- ADMIN BOOK MANAGEMENT START: load selected authors for book create/update ---
    List<Author> findByIdIn(List<Long> ids);
    // --- ADMIN BOOK MANAGEMENT END: load selected authors for book create/update ---
}
