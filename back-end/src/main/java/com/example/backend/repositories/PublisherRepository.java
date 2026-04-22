package com.example.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entities.Publisher;

public interface PublisherRepository extends JpaRepository<Publisher, Long> {
}
