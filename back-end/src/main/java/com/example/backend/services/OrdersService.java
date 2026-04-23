package com.example.backend.services;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
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
import com.example.backend.dto.responseModel.AdminRevenueOverviewResponse;
import com.example.backend.dto.responseModel.AdminTopCustomerResponse;
import com.example.backend.dto.responseModel.OrderDetailResponse;
import com.example.backend.dto.responseModel.OrderListResponse;
import com.example.backend.entities.Book;
import com.example.backend.entities.Bookauthor;
import com.example.backend.entities.Bookcategory;
import com.example.backend.entities.Bookimage;
import com.example.backend.entities.Category;
import com.example.backend.entities.Order;
import com.example.backend.entities.Orderitem;
import com.example.backend.entities.User;
import com.example.backend.entities.Useraddress;
import com.example.backend.repositories.OrdersRepository;
import com.example.backend.repositories.UserRepository;

@Service
public class OrdersService {
	private static final int DEFAULT_ADMIN_PAGE_SIZE = 5;
	private static final int DEFAULT_REVENUE_CATEGORY_PAGE_SIZE = 5;
	private static final int DEFAULT_TOP_CUSTOMER_PAGE_SIZE = 10;
	private static final Long UNCATEGORIZED_ID = -1L;
	private static final String UNCATEGORIZED_NAME = "Chua phan loai";
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

	// --- ADMIN TOP CUSTOMER START: aggregate top-customer ranking for admin page ---
	@Transactional(readOnly = true)
	public AdminTopCustomerResponse getAdminTopCustomers(String period, String keyword, int page, int size) {
		String normalizedPeriod = normalizeTopCustomerPeriod(period);
		String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);

		int safePage = Math.max(0, page);
		int safeSize = size <= 0 ? DEFAULT_TOP_CUSTOMER_PAGE_SIZE : Math.min(size, 50);

		List<Order> orders = ordersRepository.findAllWithUserByOrderByCreatedAtDesc();
		LocalDate fromDate = resolvePeriodFromDate(normalizedPeriod);

		Map<Long, TopCustomerAccumulator> byCustomer = new LinkedHashMap<>();

		for (Order order : orders) {
			if (!STATUS_DELIVERED.equals(normalizeStatus(order.getCurrentStatus()))) {
				continue;
			}

			LocalDate revenueDate = getRevenueDate(order);
			if (revenueDate == null) {
				continue;
			}
			if (fromDate != null && revenueDate.isBefore(fromDate)) {
				continue;
			}

			User user = order.getUserID();
			if (user == null || user.getId() == null) {
				continue;
			}

			if (!matchesTopCustomerKeyword(user, normalizedKeyword)) {
				continue;
			}

			TopCustomerAccumulator acc = byCustomer.computeIfAbsent(
					user.getId(),
					id -> new TopCustomerAccumulator(user)
			);

			BigDecimal orderTotal = order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount();
			acc.totalSpend = acc.totalSpend.add(orderTotal);
			acc.totalOrders += 1;
		}

		List<TopCustomerAccumulator> sortedCustomers = byCustomer.values().stream()
				.filter(acc -> acc.totalOrders > 0)
				.sorted(Comparator
						.comparing((TopCustomerAccumulator acc) -> acc.totalSpend).reversed()
						.thenComparing((TopCustomerAccumulator acc) -> acc.totalOrders, Comparator.reverseOrder())
						.thenComparing(acc -> safeLower(acc.user.getFullName()))
				)
				.toList();

		List<AdminTopCustomerResponse.TopCustomerRow> allRows = new ArrayList<>();
		for (int i = 0; i < sortedCustomers.size(); i++) {
			TopCustomerAccumulator acc = sortedCustomers.get(i);
			allRows.add(toTopCustomerRow(acc, i + 1));
		}

		List<AdminTopCustomerResponse.TopCustomerRow> podium = allRows.stream()
				.limit(3)
				.toList();

		long totalElements = allRows.size();
		int totalPages = Math.max(1, (int) Math.ceil(totalElements / (double) safeSize));
		int fromIndex = Math.min(safePage * safeSize, allRows.size());
		int toIndex = Math.min(fromIndex + safeSize, allRows.size());
		List<AdminTopCustomerResponse.TopCustomerRow> rankings = allRows.subList(fromIndex, toIndex);

		return new AdminTopCustomerResponse(
				normalizedPeriod,
				safePage,
				safeSize,
				totalPages,
				totalElements,
				podium,
				rankings
		);
	}
	// --- ADMIN TOP CUSTOMER END: aggregate top-customer ranking for admin page ---

	// --- ADMIN REVENUE START: monthly revenue dashboard aggregations for admin page ---
	@Transactional(readOnly = true)
	public AdminRevenueOverviewResponse getAdminRevenueOverview(Integer year, Integer month, int page, int size) {
		YearMonth targetMonth = resolveTargetMonth(year, month);
		YearMonth previousMonth = targetMonth.minusMonths(1);

		int safePage = Math.max(0, page);
		int safeSize = size <= 0 ? DEFAULT_REVENUE_CATEGORY_PAGE_SIZE : Math.min(size, 50);

		List<Order> allOrders = ordersRepository.findAllWithRevenueDataByOrderByCreatedAtDesc();
		List<Order> deliveredThisMonth = filterDeliveredOrdersInMonth(allOrders, targetMonth);
		List<Order> deliveredPrevMonth = filterDeliveredOrdersInMonth(allOrders, previousMonth);

		BigDecimal totalRevenue = sumOrderTotals(deliveredThisMonth);
		BigDecimal previousRevenue = sumOrderTotals(deliveredPrevMonth);

		long totalQuantity = sumSoldQuantity(deliveredThisMonth);
		long previousQuantity = sumSoldQuantity(deliveredPrevMonth);

		BigDecimal averageOrderValue = averageOrderValue(totalRevenue, deliveredThisMonth.size());
		BigDecimal previousAverageOrderValue = averageOrderValue(previousRevenue, deliveredPrevMonth.size());

		long newCustomers = countNewCustomersInMonth(targetMonth);
		long previousNewCustomers = countNewCustomersInMonth(previousMonth);

		AdminRevenueOverviewResponse.RevenueSummary summary = new AdminRevenueOverviewResponse.RevenueSummary(
				totalRevenue,
				totalQuantity,
				averageOrderValue,
				newCustomers,
				calculateGrowthPercent(totalRevenue, previousRevenue),
				calculateGrowthPercent(BigDecimal.valueOf(totalQuantity), BigDecimal.valueOf(previousQuantity)),
				calculateGrowthPercent(averageOrderValue, previousAverageOrderValue),
				calculateGrowthPercent(BigDecimal.valueOf(newCustomers), BigDecimal.valueOf(previousNewCustomers))
		);

		Map<Long, CategoryAccumulator> categoryMap = buildCategoryAccumulators(deliveredThisMonth);
		List<AdminRevenueOverviewResponse.CategoryRevenueRow> allCategoryRows = categoryMap.values().stream()
				.map(this::toCategoryRevenueRow)
				.sorted(Comparator
						.comparing(AdminRevenueOverviewResponse.CategoryRevenueRow::getTotalRevenue).reversed()
						.thenComparing(AdminRevenueOverviewResponse.CategoryRevenueRow::getTotalQuantity, Comparator.reverseOrder())
				)
				.toList();

		long totalCategoryElements = allCategoryRows.size();
		int totalCategoryPages = Math.max(1, (int) Math.ceil(totalCategoryElements / (double) safeSize));
		int fromIndex = Math.min(safePage * safeSize, allCategoryRows.size());
		int toIndex = Math.min(fromIndex + safeSize, allCategoryRows.size());
		List<AdminRevenueOverviewResponse.CategoryRevenueRow> categoryRows = allCategoryRows.subList(fromIndex, toIndex);

		List<AdminRevenueOverviewResponse.RevenueTrendPoint> trendByDay = buildDailyTrend(deliveredThisMonth, targetMonth);
		List<AdminRevenueOverviewResponse.CategoryContribution> contributions = buildContributions(allCategoryRows);

		return new AdminRevenueOverviewResponse(
				targetMonth.getYear(),
				targetMonth.getMonthValue(),
				safePage,
				safeSize,
				totalCategoryPages,
				totalCategoryElements,
				summary,
				categoryRows,
				trendByDay,
				contributions
		);
	}
	// --- ADMIN REVENUE END: monthly revenue dashboard aggregations for admin page ---

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

	// --- ADMIN TOP CUSTOMER START: helper methods for ranking and filtering ---
	private String normalizeTopCustomerPeriod(String rawPeriod) {
		if (rawPeriod == null || rawPeriod.isBlank()) {
			return "ALL";
		}

		String normalized = rawPeriod.trim().toUpperCase(Locale.ROOT);
		return switch (normalized) {
			case "ALL", "WEEK", "MONTH", "YEAR" -> normalized;
			default -> "ALL";
		};
	}

	private LocalDate resolvePeriodFromDate(String period) {
		LocalDate today = LocalDate.now();
		return switch (period) {
			case "WEEK" -> today.minusDays(6);
			case "MONTH" -> today.minusMonths(1).plusDays(1);
			case "YEAR" -> today.minusYears(1).plusDays(1);
			default -> null;
		};
	}

	private boolean matchesTopCustomerKeyword(User user, String keyword) {
		if (keyword == null || keyword.isBlank()) {
			return true;
		}

		String userIdText = user.getId() == null ? "" : String.valueOf(user.getId());
		String name = safeLower(user.getFullName());
		String email = safeLower(user.getEmail());

		return userIdText.contains(keyword)
				|| name.contains(keyword)
				|| email.contains(keyword);
	}

	private String safeLower(String text) {
		if (text == null) {
			return "";
		}
		return text.toLowerCase(Locale.ROOT);
	}

	private AdminTopCustomerResponse.TopCustomerRow toTopCustomerRow(TopCustomerAccumulator acc, int rank) {
		BigDecimal avgOrderValue = acc.totalOrders <= 0
				? BigDecimal.ZERO
				: acc.totalSpend.divide(BigDecimal.valueOf(acc.totalOrders), 0, RoundingMode.HALF_UP);

		return new AdminTopCustomerResponse.TopCustomerRow(
				acc.user.getId(),
				rank,
				acc.user.getFullName(),
				acc.user.getEmail(),
				acc.user.getAvatar(),
				acc.totalOrders,
				avgOrderValue,
				acc.totalSpend.setScale(0, RoundingMode.HALF_UP)
		);
	}

	private static class TopCustomerAccumulator {
		private final User user;
		private long totalOrders = 0;
		private BigDecimal totalSpend = BigDecimal.ZERO;

		private TopCustomerAccumulator(User user) {
			this.user = user;
		}
	}
	// --- ADMIN TOP CUSTOMER END: helper methods for ranking and filtering ---

	// --- ADMIN REVENUE START: helper methods for monthly aggregations ---
	private YearMonth resolveTargetMonth(Integer year, Integer month) {
		YearMonth now = YearMonth.now();
		int safeYear = year == null ? now.getYear() : year;
		int safeMonth = month == null ? now.getMonthValue() : month;

		if (safeMonth < 1 || safeMonth > 12) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Month must be between 1 and 12");
		}
		if (safeYear < 2000 || safeYear > 3000) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Year is out of supported range");
		}

		return YearMonth.of(safeYear, safeMonth);
	}

	private List<Order> filterDeliveredOrdersInMonth(List<Order> orders, YearMonth targetMonth) {
		return orders.stream()
				.filter(order -> STATUS_DELIVERED.equals(normalizeStatus(order.getCurrentStatus())))
				.filter(order -> getRevenueDate(order) != null)
				.filter(order -> YearMonth.from(getRevenueDate(order)).equals(targetMonth))
				.toList();
	}

	private LocalDate getRevenueDate(Order order) {
		if (order == null) {
			return null;
		}
		OffsetDateTime effectiveDate = order.getCompletedAt() != null ? order.getCompletedAt() : order.getCreatedAt();
		if (effectiveDate == null) {
			return null;
		}
		return effectiveDate.toLocalDate();
	}

	private BigDecimal sumOrderTotals(List<Order> orders) {
		return orders.stream()
				.map(order -> order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount())
				.reduce(BigDecimal.ZERO, BigDecimal::add)
				.setScale(0, RoundingMode.HALF_UP);
	}

	private long sumSoldQuantity(List<Order> orders) {
		return orders.stream()
				.flatMap(order -> order.getOrderItems().stream())
				.mapToLong(item -> item.getQuantity() == null ? 0L : item.getQuantity())
				.sum();
	}

	private BigDecimal averageOrderValue(BigDecimal totalRevenue, int orderCount) {
		if (orderCount <= 0) {
			return BigDecimal.ZERO;
		}
		return totalRevenue.divide(BigDecimal.valueOf(orderCount), 0, RoundingMode.HALF_UP);
	}

	private long countNewCustomersInMonth(YearMonth month) {
		return userRepository.findAll().stream()
				.filter(user -> user.getCreatedAt() != null)
				.filter(user -> YearMonth.from(user.getCreatedAt().toLocalDate()).equals(month))
				.count();
	}

	private BigDecimal calculateGrowthPercent(BigDecimal current, BigDecimal previous) {
		BigDecimal safeCurrent = current == null ? BigDecimal.ZERO : current;
		BigDecimal safePrevious = previous == null ? BigDecimal.ZERO : previous;

		if (safePrevious.compareTo(BigDecimal.ZERO) == 0) {
			if (safeCurrent.compareTo(BigDecimal.ZERO) == 0) {
				return BigDecimal.ZERO;
			}
			return BigDecimal.valueOf(100);
		}

		return safeCurrent.subtract(safePrevious)
				.multiply(BigDecimal.valueOf(100))
				.divide(safePrevious, 1, RoundingMode.HALF_UP);
	}

	private Map<Long, CategoryAccumulator> buildCategoryAccumulators(List<Order> orders) {
		Map<Long, CategoryAccumulator> map = new LinkedHashMap<>();

		for (Order order : orders) {
			for (Orderitem item : order.getOrderItems()) {
				Book book = item.getBookID();
				Category category = resolvePrimaryCategory(book);

				Long categoryId = category == null ? UNCATEGORIZED_ID : category.getId();
				String categoryName = category == null ? UNCATEGORIZED_NAME : category.getCategoryName();

				CategoryAccumulator acc = map.computeIfAbsent(
						categoryId,
						id -> new CategoryAccumulator(id, categoryName)
				);

				BigDecimal unitPrice = item.getPrice() == null ? BigDecimal.ZERO : item.getPrice();
				long quantity = item.getQuantity() == null ? 0L : item.getQuantity();
				BigDecimal lineRevenue = unitPrice.multiply(BigDecimal.valueOf(quantity));

				acc.totalRevenue = acc.totalRevenue.add(lineRevenue);
				acc.totalQuantity += quantity;
				acc.highestPrice = acc.highestPrice.max(unitPrice);

				if (acc.lowestPrice == null || unitPrice.compareTo(acc.lowestPrice) < 0) {
					acc.lowestPrice = unitPrice;
				}
			}
		}

		return map;
	}

	private Category resolvePrimaryCategory(Book book) {
		if (book == null || book.getBookCategories() == null || book.getBookCategories().isEmpty()) {
			return null;
		}

		// Use a stable primary category so each sold item contributes to exactly one bucket.
		return book.getBookCategories().stream()
				.map(Bookcategory::getCategoryID)
				.filter(Objects::nonNull)
				.filter(category -> !Boolean.TRUE.equals(category.getIsDeleted()))
				.min(Comparator.comparing(Category::getId))
				.orElse(null);
	}

	private AdminRevenueOverviewResponse.CategoryRevenueRow toCategoryRevenueRow(CategoryAccumulator acc) {
		BigDecimal safeRevenue = acc.totalRevenue.setScale(0, RoundingMode.HALF_UP);
		BigDecimal avgPrice;
		if (acc.totalQuantity <= 0) {
			avgPrice = BigDecimal.ZERO;
		} else {
			avgPrice = safeRevenue.divide(BigDecimal.valueOf(acc.totalQuantity), 0, RoundingMode.HALF_UP);
		}

		return new AdminRevenueOverviewResponse.CategoryRevenueRow(
				acc.categoryId,
				acc.categoryName,
				safeRevenue,
				acc.totalQuantity,
				acc.highestPrice == null ? BigDecimal.ZERO : acc.highestPrice.setScale(0, RoundingMode.HALF_UP),
				acc.lowestPrice == null ? BigDecimal.ZERO : acc.lowestPrice.setScale(0, RoundingMode.HALF_UP),
				avgPrice
		);
	}

	private List<AdminRevenueOverviewResponse.RevenueTrendPoint> buildDailyTrend(List<Order> orders, YearMonth targetMonth) {
		Map<Integer, BigDecimal> revenueByDay = new LinkedHashMap<>();
		for (int day = 1; day <= targetMonth.lengthOfMonth(); day++) {
			revenueByDay.put(day, BigDecimal.ZERO);
		}

		for (Order order : orders) {
			LocalDate revenueDate = getRevenueDate(order);
			if (revenueDate == null || !YearMonth.from(revenueDate).equals(targetMonth)) {
				continue;
			}

			BigDecimal value = order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount();
			int day = revenueDate.getDayOfMonth();
			revenueByDay.put(day, revenueByDay.get(day).add(value));
		}

		List<AdminRevenueOverviewResponse.RevenueTrendPoint> points = new ArrayList<>();
		for (Map.Entry<Integer, BigDecimal> entry : revenueByDay.entrySet()) {
			int day = entry.getKey();
			points.add(new AdminRevenueOverviewResponse.RevenueTrendPoint(
					day,
					String.format("%02d", day),
					entry.getValue().setScale(0, RoundingMode.HALF_UP)
			));
		}
		return points;
	}

	private List<AdminRevenueOverviewResponse.CategoryContribution> buildContributions(
			List<AdminRevenueOverviewResponse.CategoryRevenueRow> rows
	) {
		BigDecimal total = rows.stream()
				.map(AdminRevenueOverviewResponse.CategoryRevenueRow::getTotalRevenue)
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		return rows.stream()
				.limit(6)
				.map(row -> {
					BigDecimal percentage = total.compareTo(BigDecimal.ZERO) == 0
							? BigDecimal.ZERO
							: row.getTotalRevenue()
									.multiply(BigDecimal.valueOf(100))
									.divide(total, 1, RoundingMode.HALF_UP);

					return new AdminRevenueOverviewResponse.CategoryContribution(
							row.getCategoryId(),
							row.getCategoryName(),
							row.getTotalRevenue(),
							percentage
					);
				})
				.toList();
	}

	private static class CategoryAccumulator {
		private final Long categoryId;
		private final String categoryName;
		private BigDecimal totalRevenue = BigDecimal.ZERO;
		private long totalQuantity = 0;
		private BigDecimal highestPrice = BigDecimal.ZERO;
		private BigDecimal lowestPrice = null;

		private CategoryAccumulator(Long categoryId, String categoryName) {
			this.categoryId = categoryId;
			this.categoryName = categoryName;
		}
	}
	// --- ADMIN REVENUE END: helper methods for monthly aggregations ---
	// === REFACTOR END: expose current user's order list + count-by-status for order tabs ===
}
