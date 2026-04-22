package com.example.backend.repositories;

import com.example.backend.entities.Orderitem;
import com.example.backend.entities.OrderitemId;
import org.springframework.data.jpa.repository.JpaRepository;

// --- VNPAY REFACTOR START: repository for order items, needed to persist line items during checkout ---
public interface OrderItemRepository extends JpaRepository<Orderitem, OrderitemId> {
}
// --- VNPAY REFACTOR END: repository for order items, needed to persist line items during checkout ---
