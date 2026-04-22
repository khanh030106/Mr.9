package com.example.backend.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.requests.AdminOrderStatusUpdateRequest;
import com.example.backend.dto.requests.OrderActionRequest;
import com.example.backend.dto.responseModel.AdminOrderDetailResponse;
import com.example.backend.dto.responseModel.AdminOrderListResponse;
import com.example.backend.dto.responseModel.OrderDetailResponse;
import com.example.backend.dto.responseModel.OrderListResponse;
import com.example.backend.entities.Book;
import com.example.backend.entities.Bookauthor;
import com.example.backend.entities.Bookimage;
import com.example.backend.entities.Order;
import com.example.backend.entities.Orderitem;
import com.example.backend.entities.User;
import com.example.backend.entities.Useraddress;
import com.example.backend.repositories.OrdersRepository;
import com.example.backend.repositories.UserRepository;

@Service
public class OrdersService {
	private static final int DEFAULT_ADMIN_PAGE_SIZE = 5;
	private static final String STATUS_PENDING = "PENDING";
	private static final String STATUS_PROCESSING = "PROCESSING";
	private static final String STATUS_SHIPPED = "SHIPPED";
	private static final String STATUS_DELIVERED = "DELIVERED";
	private static final String STATUS_CANCELED = "CANCELED";
	private static final String STATUS_RETURNED = "RETURNED";
	private static final String CANCEL_REQUEST_PREFIX = "REQUEST_CANCEL:";
	private static final String RETURN_REQUEST_PREFIX = "REQUEST_RETURN:";

	private static final List<String> STATUS_ORDER = List.of(
			STATUS_PENDING,
			STATUS_PROCESSING,
			STATUS_SHIPPED,
			STATUS_DELIVERED,
			STATUS_CANCELED,
			STATUS_RETURNED
	);
	private static final Set<String> ADMIN_ALLOWED_UPDATE_STATUSES = Set.copyOf(STATUS_ORDER);

	private final OrdersRepository ordersRepository;
	private final UserRepository userRepository;

	public OrdersService(OrdersRepository ordersRepository, UserRepository userRepository) {
		this.ordersRepository = ordersRepository;
		this.userRepository = userRepository;
	}

	// === REFACTOR START: expose current user's order list + count-by-status for order tabs ===
	public OrderListResponse getMyOrders(String email) {
		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		List<Order> orders = ordersRepository.findByUserIDOrderByCreatedAtDesc(user);
		Map<String, Long> counts = initCounts();
		List<OrderListResponse.OrderSummary> rows = new ArrayList<>();

		for (Order order : orders) {
			String normalizedStatus = normalizeStatus(order.getCurrentStatus());
			if (counts.containsKey(normalizedStatus)) {
				counts.put(normalizedStatus, counts.get(normalizedStatus) + 1);
			}
			counts.put("ALL", counts.get("ALL") + 1);

			List<OrderListResponse.OrderItem> items = order.getOrderItems().stream()
					.map(this::toOrderItem)
					.toList();

			rows.add(new OrderListResponse.OrderSummary(
					order.getId(),
					normalizedStatus,
					order.getTotalAmount(),
					order.getCreatedAt(),
					items
			));
		}

		return new OrderListResponse(rows, counts);
	}

	// --- ORDER DETAIL REFACTOR START: user can view detail/cancel/return orders with status guards ---
	public OrderDetailResponse getMyOrderDetail(String email, Long orderId) {
		Order order = getUserOrderOrThrow(email, orderId);
		return toOrderDetail(order);
	}

	@Transactional
	public OrderDetailResponse requestCancelOrder(String email, Long orderId, OrderActionRequest request) {
		Order order = getUserOrderOrThrow(email, orderId);
		String currentStatus = normalizeStatus(order.getCurrentStatus());

		if (!List.of(STATUS_PENDING, STATUS_PROCESSING).contains(currentStatus)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Only pending or processing orders can be canceled"
			);
		}
		if (hasCancelRequest(order)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cancel request is already pending admin review");
		}

		String reason = normalizeReason(request);
		order.setCanceledReason(CANCEL_REQUEST_PREFIX + (reason.isBlank() ? "Customer requested cancellation" : reason));
		ordersRepository.save(order);

		return toOrderDetail(order);
	}

	@Transactional
	public OrderDetailResponse requestReturnOrder(String email, Long orderId, OrderActionRequest request) {
		Order order = getUserOrderOrThrow(email, orderId);
		String currentStatus = normalizeStatus(order.getCurrentStatus());

		if (!STATUS_DELIVERED.equals(currentStatus)) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Only delivered orders can be returned"
			);
		}
		if (hasReturnRequest(order)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Return request is already pending admin review");
		}

		String reason = normalizeReason(request);
		String requestText = RETURN_REQUEST_PREFIX + (reason.isBlank() ? "Customer requested return" : reason);
		appendOrderNote(order, requestText);
		ordersRepository.save(order);

		return toOrderDetail(order);
	}

	// --- ADMIN ORDERS REFACTOR START: list/search/paginate/detail/update/approve-refuse flows ---
	public AdminOrderListResponse getAdminOrders(int page, int size, String keyword, String status) {
		int safePage = Math.max(0, page);
		int safeSize = size <= 0 ? DEFAULT_ADMIN_PAGE_SIZE : Math.min(size, 50);

		List<Order> allOrders = ordersRepository.findAllByOrderByCreatedAtDesc();
		AdminOrderListResponse.Stats stats = buildAdminStats(allOrders);

		String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
		String normalizedStatus = normalizeFilterStatus(status);

		List<Order> filtered = allOrders.stream()
				.filter(order -> matchesAdminKeyword(order, normalizedKeyword))
				.filter(order -> matchesAdminStatus(order, normalizedStatus))
				.toList();

		long totalElements = filtered.size();
		int totalPages = Math.max(1, (int) Math.ceil(totalElements / (double) safeSize));
		int fromIndex = Math.min(safePage * safeSize, filtered.size());
		int toIndex = Math.min(fromIndex + safeSize, filtered.size());

		List<AdminOrderListResponse.OrderRow> rows = filtered.subList(fromIndex, toIndex).stream()
				.map(this::toAdminOrderRow)
				.toList();

		return new AdminOrderListResponse(rows, safePage, safeSize, totalPages, totalElements, stats);
	}

	public AdminOrderDetailResponse getAdminOrderDetail(Long orderId) {
		Order order = getOrderByIdOrThrow(orderId);
		return toAdminOrderDetail(order);
	}

	@Transactional
	public AdminOrderDetailResponse updateAdminOrderStatus(Long orderId, AdminOrderStatusUpdateRequest request) {
		if (request == null || request.getStatus() == null || request.getStatus().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
		}

		Order order = getOrderByIdOrThrow(orderId);
		String nextStatus = normalizeStatus(request.getStatus());
		if (!ADMIN_ALLOWED_UPDATE_STATUSES.contains(nextStatus)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
		}

		order.setCurrentStatus(nextStatus);
		if (STATUS_DELIVERED.equals(nextStatus) && order.getCompletedAt() == null) {
			order.setCompletedAt(OffsetDateTime.now());
		}
		if (STATUS_CANCELED.equals(nextStatus) && order.getCanceledAt() == null) {
			order.setCanceledAt(OffsetDateTime.now());
		}

		if (!List.of(STATUS_PENDING, STATUS_PROCESSING).contains(nextStatus)) {
			clearCancelRequest(order);
		}
		if (!STATUS_DELIVERED.equals(nextStatus)) {
			clearReturnRequest(order);
		}

		String adminNote = normalizeReason(request.getNote());
		if (!adminNote.isBlank()) {
			appendOrderNote(order, "Admin note: " + adminNote);
		}

		ordersRepository.save(order);
		return toAdminOrderDetail(order);
	}

	@Transactional
	public AdminOrderDetailResponse confirmCancelRequest(Long orderId, OrderActionRequest request) {
		Order order = getOrderByIdOrThrow(orderId);
		if (!hasCancelRequest(order)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has no pending cancel request");
		}

		String requestedReason = extractCancelRequestReason(order);
		String adminReason = normalizeReason(request);
		order.setCurrentStatus(STATUS_CANCELED);
		order.setCanceledAt(OffsetDateTime.now());
		order.setCanceledReason(adminReason.isBlank() ? requestedReason : adminReason);
		ordersRepository.save(order);
		return toAdminOrderDetail(order);
	}

	@Transactional
	public AdminOrderDetailResponse refuseCancelRequest(Long orderId, OrderActionRequest request) {
		Order order = getOrderByIdOrThrow(orderId);
		if (!hasCancelRequest(order)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has no pending cancel request");
		}

		String reason = normalizeReason(request);
		clearCancelRequest(order);
		appendOrderNote(order, reason.isBlank()
				? "Cancel request refused by admin"
				: "Cancel request refused: " + reason);
		ordersRepository.save(order);
		return toAdminOrderDetail(order);
	}

	@Transactional
	public AdminOrderDetailResponse confirmReturnRequest(Long orderId, OrderActionRequest request) {
		Order order = getOrderByIdOrThrow(orderId);
		if (!hasReturnRequest(order)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has no pending return request");
		}

		String requestedReason = extractReturnRequestReason(order);
		String adminReason = normalizeReason(request);

		order.setCurrentStatus(STATUS_RETURNED);
		clearReturnRequest(order);
		appendOrderNote(order, adminReason.isBlank()
				? "Return approved: " + requestedReason
				: "Return approved: " + adminReason);
		ordersRepository.save(order);
		return toAdminOrderDetail(order);
	}

	@Transactional
	public AdminOrderDetailResponse refuseReturnRequest(Long orderId, OrderActionRequest request) {
		Order order = getOrderByIdOrThrow(orderId);
		if (!hasReturnRequest(order)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This order has no pending return request");
		}

		String reason = normalizeReason(request);
		clearReturnRequest(order);
		appendOrderNote(order, reason.isBlank()
				? "Return request refused by admin"
				: "Return request refused: " + reason);
		ordersRepository.save(order);
		return toAdminOrderDetail(order);
	}
	// --- ADMIN ORDERS REFACTOR END: list/search/paginate/detail/update/approve-refuse flows ---

	private Order getUserOrderOrThrow(String email, Long orderId) {
		if (orderId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order ID is required");
		}

		User user = userRepository.findByEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		return ordersRepository.findByIdAndUserID(orderId, user)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
	}

	private OrderDetailResponse toOrderDetail(Order order) {
		List<OrderDetailResponse.OrderItem> detailItems = order.getOrderItems().stream()
				.map(this::toOrderDetailItem)
				.toList();

		Useraddress address = order.getAddressID();
		OrderDetailResponse.AddressInfo addressInfo = address == null ? null : new OrderDetailResponse.AddressInfo(
				address.getReceiverName(),
				address.getPhone(),
				address.getAddressLine(),
				address.getWard(),
				address.getDistrict(),
				address.getProvince()
		);

		return new OrderDetailResponse(
				order.getId(),
				normalizeStatus(order.getCurrentStatus()),
				order.getPaymentMethod(),
				sanitizeOrderNote(order.getNote()),
				getDisplayCanceledReason(order),
				order.getCanceledAt(),
				order.getCreatedAt(),
				order.getShippingFee() == null ? BigDecimal.ZERO : order.getShippingFee(),
				order.getDiscountAmount() == null ? BigDecimal.ZERO : order.getDiscountAmount(),
				order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount(),
				addressInfo,
				detailItems
		);
	}

	private OrderDetailResponse.OrderItem toOrderDetailItem(Orderitem item) {
		Book book = item.getBookID();

		String imageUrl = book.getBookImages().stream()
				.filter(img -> Boolean.TRUE.equals(img.getIsMain()))
				.map(Bookimage::getImageUrl)
				.filter(Objects::nonNull)
				.findFirst()
				.orElse(null);

		String authorName = book.getBookAuthors().stream()
				.map(Bookauthor::getAuthorID)
				.filter(Objects::nonNull)
				.map(author -> author.getAuthorName())
				.filter(Objects::nonNull)
				.findFirst()
				.orElse("Unknown author");

		BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
		int quantity = 0;
		if (item.getQuantity() != null) {
			quantity = item.getQuantity();
		}
		BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

		return new OrderDetailResponse.OrderItem(
				book.getId(),
				book.getTitle(),
				authorName,
				imageUrl,
				quantity,
				unitPrice,
				lineTotal
		);
	}

	private String normalizeReason(OrderActionRequest request) {
		if (request == null || request.getReason() == null) {
			return "";
		}
		return request.getReason().trim();
	}

	private String normalizeReason(String reason) {
		if (reason == null) {
			return "";
		}
		return reason.trim();
	}
	// --- ORDER DETAIL REFACTOR END: user can view detail/cancel/return orders with status guards ---

	private Order getOrderByIdOrThrow(Long orderId) {
		if (orderId == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order ID is required");
		}

		return ordersRepository.findWithDetailsById(orderId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
	}

	private AdminOrderListResponse.Stats buildAdminStats(List<Order> orders) {
		long totalOrders = orders.size();
		long pendingOrders = orders.stream()
				.filter(order -> STATUS_PENDING.equals(normalizeStatus(order.getCurrentStatus())))
				.count();

		LocalDate today = LocalDate.now();
		BigDecimal revenueToday = orders.stream()
				.filter(order -> STATUS_DELIVERED.equals(normalizeStatus(order.getCurrentStatus())))
				.filter(order -> order.getCreatedAt() != null && order.getCreatedAt().toLocalDate().isEqual(today))
				.map(order -> order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount())
				.reduce(BigDecimal.ZERO, BigDecimal::add)
				.setScale(0, RoundingMode.HALF_UP);

		return new AdminOrderListResponse.Stats(totalOrders, pendingOrders, revenueToday);
	}

	private boolean matchesAdminKeyword(Order order, String keyword) {
		if (keyword == null || keyword.isBlank()) {
			return true;
		}

		String safeKeyword = keyword.toLowerCase(Locale.ROOT);
		String orderIdText = String.valueOf(order.getId());
		String customerName = order.getUserID() == null ? "" : normalizeReason(order.getUserID().getFullName());
		String customerEmail = order.getUserID() == null ? "" : normalizeReason(order.getUserID().getEmail());
		String receiverName = order.getAddressID() == null ? "" : normalizeReason(order.getAddressID().getReceiverName());

		return orderIdText.contains(safeKeyword)
				|| customerName.toLowerCase(Locale.ROOT).contains(safeKeyword)
				|| customerEmail.toLowerCase(Locale.ROOT).contains(safeKeyword)
				|| receiverName.toLowerCase(Locale.ROOT).contains(safeKeyword);
	}

	private boolean matchesAdminStatus(Order order, String normalizedStatus) {
		if (normalizedStatus == null || normalizedStatus.isBlank() || "ALL".equals(normalizedStatus)) {
			return true;
		}
		return normalizeStatus(order.getCurrentStatus()).equals(normalizedStatus);
	}

	private String normalizeFilterStatus(String rawStatus) {
		if (rawStatus == null || rawStatus.isBlank()) {
			return "ALL";
		}
		String normalized = rawStatus.trim().toUpperCase(Locale.ROOT).replace(' ', '_').replace('-', '_');
		if ("ALL".equals(normalized)) {
			return "ALL";
		}
		if (ADMIN_ALLOWED_UPDATE_STATUSES.contains(normalized)) {
			return normalized;
		}
		if ("CANCELLED".equals(normalized)) {
			return STATUS_CANCELED;
		}
		return "ALL";
	}

	private AdminOrderListResponse.OrderRow toAdminOrderRow(Order order) {
		User user = order.getUserID();
		String customerName = user == null || user.getFullName() == null ? "Unknown" : user.getFullName();
		String customerEmail = user == null || user.getEmail() == null ? "" : user.getEmail();

		return new AdminOrderListResponse.OrderRow(
				order.getId(),
				customerName,
				customerEmail,
				order.getCreatedAt(),
				order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount(),
				normalizeStatus(order.getCurrentStatus()),
				hasCancelRequest(order),
				hasReturnRequest(order)
		);
	}

	private AdminOrderDetailResponse toAdminOrderDetail(Order order) {
		User user = order.getUserID();
		Useraddress address = order.getAddressID();

		List<AdminOrderDetailResponse.OrderItem> detailItems = order.getOrderItems().stream()
				.map(this::toAdminOrderDetailItem)
				.toList();

		AdminOrderDetailResponse.AddressInfo addressInfo = address == null ? null : new AdminOrderDetailResponse.AddressInfo(
				address.getReceiverName(),
				address.getPhone(),
				address.getAddressLine(),
				address.getWard(),
				address.getDistrict(),
				address.getProvince()
		);

		return new AdminOrderDetailResponse(
				order.getId(),
				normalizeStatus(order.getCurrentStatus()),
				user == null ? "Unknown" : user.getFullName(),
				user == null ? "" : user.getEmail(),
				order.getPaymentMethod(),
				sanitizeOrderNote(order.getNote()),
				getDisplayCanceledReason(order),
				order.getCanceledAt(),
				order.getCreatedAt(),
				order.getShippingFee() == null ? BigDecimal.ZERO : order.getShippingFee(),
				order.getDiscountAmount() == null ? BigDecimal.ZERO : order.getDiscountAmount(),
				order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount(),
				hasCancelRequest(order),
				extractCancelRequestReason(order),
				hasReturnRequest(order),
				extractReturnRequestReason(order),
				addressInfo,
				detailItems
		);
	}

	private AdminOrderDetailResponse.OrderItem toAdminOrderDetailItem(Orderitem item) {
		OrderDetailResponse.OrderItem mapped = toOrderDetailItem(item);
		return new AdminOrderDetailResponse.OrderItem(
				mapped.getBookId(),
				mapped.getTitle(),
				mapped.getAuthorName(),
				mapped.getImageUrl(),
				mapped.getQuantity(),
				mapped.getPrice(),
				mapped.getLineTotal()
		);
	}

	private boolean hasCancelRequest(Order order) {
		return order != null
				&& order.getCanceledReason() != null
				&& order.getCanceledReason().startsWith(CANCEL_REQUEST_PREFIX)
				&& !STATUS_CANCELED.equals(normalizeStatus(order.getCurrentStatus()));
	}

	private String extractCancelRequestReason(Order order) {
		if (order == null || order.getCanceledReason() == null) {
			return "";
		}
		if (!order.getCanceledReason().startsWith(CANCEL_REQUEST_PREFIX)) {
			return "";
		}
		return order.getCanceledReason().substring(CANCEL_REQUEST_PREFIX.length()).trim();
	}

	private void clearCancelRequest(Order order) {
		if (order == null || order.getCanceledReason() == null) {
			return;
		}
		if (order.getCanceledReason().startsWith(CANCEL_REQUEST_PREFIX)) {
			order.setCanceledReason(null);
		}
	}

	private boolean hasReturnRequest(Order order) {
		return !extractReturnRequestReason(order).isBlank() && !STATUS_RETURNED.equals(normalizeStatus(order.getCurrentStatus()));
	}

	private String extractReturnRequestReason(Order order) {
		if (order == null || order.getNote() == null || order.getNote().isBlank()) {
			return "";
		}

		for (String part : order.getNote().split("\\\\|")) {
			String item = part.trim();
			if (item.startsWith(RETURN_REQUEST_PREFIX)) {
				return item.substring(RETURN_REQUEST_PREFIX.length()).trim();
			}
		}
		return "";
	}

	private void clearReturnRequest(Order order) {
		if (order == null || order.getNote() == null || order.getNote().isBlank()) {
			return;
		}

		List<String> remaining = new ArrayList<>();
		for (String part : order.getNote().split("\\\\|")) {
			String item = part.trim();
			if (item.isBlank() || item.startsWith(RETURN_REQUEST_PREFIX)) {
				continue;
			}
			remaining.add(item);
		}

		order.setNote(remaining.isEmpty() ? null : String.join(" | ", remaining));
	}

	private void appendOrderNote(Order order, String appendText) {
		String text = normalizeReason(appendText);
		if (text.isBlank()) {
			return;
		}

		String current = order.getNote();
		if (current == null || current.isBlank()) {
			order.setNote(text);
			return;
		}

		order.setNote(current + " | " + text);
	}

	private String sanitizeOrderNote(String note) {
		if (note == null || note.isBlank()) {
			return note;
		}

		List<String> parts = new ArrayList<>();
		for (String part : note.split("\\\\|")) {
			String item = part.trim();
			if (item.isBlank() || item.startsWith(RETURN_REQUEST_PREFIX)) {
				continue;
			}
			parts.add(item);
		}

		if (parts.isEmpty()) {
			return "";
		}
		return parts.stream().collect(Collectors.joining(" | "));
	}

	private String getDisplayCanceledReason(Order order) {
		if (order == null || order.getCanceledReason() == null || order.getCanceledReason().isBlank()) {
			return order == null ? null : order.getCanceledReason();
		}
		if (order.getCanceledReason().startsWith(CANCEL_REQUEST_PREFIX)) {
			return order.getCanceledReason().substring(CANCEL_REQUEST_PREFIX.length()).trim();
		}
		return order.getCanceledReason();
	}

	private Map<String, Long> initCounts() {
		Map<String, Long> counts = new LinkedHashMap<>();
		counts.put("ALL", 0L);
		STATUS_ORDER.forEach(status -> counts.put(status, 0L));
		return counts;
	}

	private OrderListResponse.OrderItem toOrderItem(Orderitem item) {
		Book book = item.getBookID();

		String imageUrl = book.getBookImages().stream()
				.filter(img -> Boolean.TRUE.equals(img.getIsMain()))
				.map(Bookimage::getImageUrl)
				.filter(Objects::nonNull)
				.findFirst()
				.orElse(null);

		String authorName = book.getBookAuthors().stream()
				.map(Bookauthor::getAuthorID)
				.filter(Objects::nonNull)
				.map(author -> author.getAuthorName())
				.filter(Objects::nonNull)
				.findFirst()
				.orElse("Unknown author");

		BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
		int quantity = 0;
		if (item.getQuantity() != null) {
			quantity = item.getQuantity();
		}
		BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));

		return new OrderListResponse.OrderItem(
				book.getId(),
				book.getTitle(),
				authorName,
				imageUrl,
				quantity,
				unitPrice,
				lineTotal
		);
	}

	private String normalizeStatus(String rawStatus) {
		if (rawStatus == null || rawStatus.isBlank()) {
			return STATUS_PENDING;
		}

		String normalized = rawStatus.trim().toUpperCase(Locale.ROOT).replace(' ', '_').replace('-', '_');
		return switch (normalized) {
			case STATUS_PENDING, STATUS_PROCESSING, STATUS_SHIPPED, STATUS_DELIVERED, STATUS_CANCELED, STATUS_RETURNED -> normalized;
			case "CANCELLED" -> STATUS_CANCELED;
			default -> STATUS_PENDING;
		};
	}
	// === REFACTOR END: expose current user's order list + count-by-status for order tabs ===
}
