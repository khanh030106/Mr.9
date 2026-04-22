package com.example.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entities.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
}
