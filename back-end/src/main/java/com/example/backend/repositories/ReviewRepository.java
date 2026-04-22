package com.example.backend.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entities.Review;

// --- REVIEW COMMENT REFACTOR START: repository for review write operations ---
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findTopByOrderByIdDesc();
}
// --- REVIEW COMMENT REFACTOR END: repository for review write operations ---
