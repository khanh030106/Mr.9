package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.backend.entities.Order;
import com.example.backend.entities.User;

public interface OrdersRepository extends JpaRepository<Order, Long> {
	// --- VNPAY REFACTOR START: max-ID lookup for manual order-ID generation ---
	Optional<Order> findTopByOrderByIdDesc();
	// --- VNPAY REFACTOR END: max-ID lookup for manual order-ID generation ---

	// === REFACTOR START: query my orders with needed relations for customer order tabs ===
	@EntityGraph(attributePaths = {
			"orderItems",
			"orderItems.bookID",
			"orderItems.bookID.bookImages",
			"orderItems.bookID.bookAuthors",
			"orderItems.bookID.bookAuthors.authorID"
	})
	List<Order> findByUserIDOrderByCreatedAtDesc(User userID);
	// === REFACTOR END: query my orders with needed relations for customer order tabs ===

	// --- ORDER DETAIL REFACTOR START: load user-owned order with all data needed for detail modal ---
	@EntityGraph(attributePaths = {
			"addressID",
			"orderItems",
			"orderItems.bookID",
			"orderItems.bookID.bookImages",
			"orderItems.bookID.bookAuthors",
			"orderItems.bookID.bookAuthors.authorID"
	})
	Optional<Order> findByIdAndUserID(Long id, User userID);
	// --- ORDER DETAIL REFACTOR END: load user-owned order with all data needed for detail modal ---

	// --- ADMIN ORDERS REFACTOR START: load full order graph for admin list/detail and actions ---
	@EntityGraph(attributePaths = {
			"userID",
			"addressID",
			"orderItems",
			"orderItems.bookID",
			"orderItems.bookID.bookImages",
			"orderItems.bookID.bookAuthors",
			"orderItems.bookID.bookAuthors.authorID"
	})
	List<Order> findAllByOrderByCreatedAtDesc();

	@EntityGraph(attributePaths = {
			"userID",
			"addressID",
			"orderItems",
			"orderItems.bookID",
			"orderItems.bookID.bookImages",
			"orderItems.bookID.bookAuthors",
			"orderItems.bookID.bookAuthors.authorID"
	})
	Optional<Order> findWithDetailsById(Long id);
	// --- ADMIN ORDERS REFACTOR END: load full order graph for admin list/detail and actions ---
}
