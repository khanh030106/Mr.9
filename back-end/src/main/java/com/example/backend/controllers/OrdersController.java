package com.example.backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import com.example.backend.dto.requests.AdminOrderStatusUpdateRequest;
import com.example.backend.dto.requests.OrderActionRequest;
import com.example.backend.dto.responseModel.AdminOrderDetailResponse;
import com.example.backend.dto.responseModel.AdminOrderListResponse;
import com.example.backend.dto.responseModel.OrderDetailResponse;
import com.example.backend.dto.responseModel.OrderListResponse;
import com.example.backend.services.OrdersService;

@RestController
@RequestMapping("/api/orders")
public class OrdersController {
	private final OrdersService ordersService;

	public OrdersController(OrdersService ordersService) {
		this.ordersService = ordersService;
	}

	// === REFACTOR START: current user orders endpoint for customer order tabs ===
	@GetMapping("/me")
	public ResponseEntity<OrderListResponse> getMyOrders(@AuthenticationPrincipal UserDetails userDetails) {
		return ResponseEntity.ok(ordersService.getMyOrders(userDetails.getUsername()));
	}

	@GetMapping("/me/{orderId}")
	public ResponseEntity<OrderDetailResponse> getMyOrderDetail(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId
	) {
		return ResponseEntity.ok(ordersService.getMyOrderDetail(userDetails.getUsername(), orderId));
	}

	@PatchMapping("/me/{orderId}/cancel-request")
	public ResponseEntity<OrderDetailResponse> requestCancelOrder(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId,
			@RequestBody(required = false) OrderActionRequest request
	) {
		return ResponseEntity.ok(ordersService.requestCancelOrder(userDetails.getUsername(), orderId, request));
	}

	@PatchMapping("/me/{orderId}/return-request")
	public ResponseEntity<OrderDetailResponse> requestReturnOrder(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId,
			@RequestBody(required = false) OrderActionRequest request
	) {
		return ResponseEntity.ok(ordersService.requestReturnOrder(userDetails.getUsername(), orderId, request));
	}

	@GetMapping("/admin")
	public ResponseEntity<AdminOrderListResponse> getAdminOrders(
			@AuthenticationPrincipal UserDetails userDetails,
			@RequestParam(name = "page", defaultValue = "0") int page,
			@RequestParam(name = "size", defaultValue = "5") int size,
			@RequestParam(name = "keyword", required = false) String keyword,
			@RequestParam(name = "status", required = false) String status
	) {
		assertAdmin(userDetails);
		return ResponseEntity.ok(ordersService.getAdminOrders(page, size, keyword, status));
	}

	@GetMapping("/admin/{orderId}")
	public ResponseEntity<AdminOrderDetailResponse> getAdminOrderDetail(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId
	) {
		assertAdmin(userDetails);
		return ResponseEntity.ok(ordersService.getAdminOrderDetail(orderId));
	}

	@PatchMapping("/admin/{orderId}/status")
	public ResponseEntity<AdminOrderDetailResponse> updateAdminOrderStatus(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId,
			@RequestBody AdminOrderStatusUpdateRequest request
	) {
		assertAdmin(userDetails);
		return ResponseEntity.ok(ordersService.updateAdminOrderStatus(orderId, request));
	}

	@PatchMapping("/admin/{orderId}/cancel-request/confirm")
	public ResponseEntity<AdminOrderDetailResponse> confirmCancelRequest(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId,
			@RequestBody(required = false) OrderActionRequest request
	) {
		assertAdmin(userDetails);
		return ResponseEntity.ok(ordersService.confirmCancelRequest(orderId, request));
	}

	@PatchMapping("/admin/{orderId}/cancel-request/refuse")
	public ResponseEntity<AdminOrderDetailResponse> refuseCancelRequest(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId,
			@RequestBody(required = false) OrderActionRequest request
	) {
		assertAdmin(userDetails);
		return ResponseEntity.ok(ordersService.refuseCancelRequest(orderId, request));
	}

	@PatchMapping("/admin/{orderId}/return-request/confirm")
	public ResponseEntity<AdminOrderDetailResponse> confirmReturnRequest(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId,
			@RequestBody(required = false) OrderActionRequest request
	) {
		assertAdmin(userDetails);
		return ResponseEntity.ok(ordersService.confirmReturnRequest(orderId, request));
	}

	@PatchMapping("/admin/{orderId}/return-request/refuse")
	public ResponseEntity<AdminOrderDetailResponse> refuseReturnRequest(
			@AuthenticationPrincipal UserDetails userDetails,
			@PathVariable Long orderId,
			@RequestBody(required = false) OrderActionRequest request
	) {
		assertAdmin(userDetails);
		return ResponseEntity.ok(ordersService.refuseReturnRequest(orderId, request));
	}
	// === REFACTOR END: current user orders endpoint for customer order tabs ===

	private void assertAdmin(UserDetails userDetails) {
		if (userDetails == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
		}

		boolean isAdmin = userDetails.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.anyMatch(role -> "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role));

		if (!isAdmin) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
		}
	}
}
