package com.example.backend.repositories;

import com.example.backend.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// --- STRIPE REFACTOR START: repository for payments table used by checkout + Stripe flow ---
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findTopByOrderByIdDesc();

    Optional<Payment> findTopByOrderID_IdOrderByIdDesc(Long orderId);

    Optional<Payment> findByTransactionCode(String transactionCode);
}
// --- STRIPE REFACTOR END: repository for payments table used by checkout + Stripe flow ---
