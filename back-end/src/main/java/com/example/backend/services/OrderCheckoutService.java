package com.example.backend.services;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.requests.PlaceOrderRequest;
import com.example.backend.dto.responseModel.PlaceOrderResponse;
import com.example.backend.entities.Book;
import com.example.backend.entities.Cart;
import com.example.backend.entities.Order;
import com.example.backend.entities.Orderitem;
import com.example.backend.entities.OrderitemId;
import com.example.backend.entities.Payment;
import com.example.backend.entities.Promotion;
import com.example.backend.entities.Promotionbook;
import com.example.backend.entities.User;
import com.example.backend.entities.Useraddress;
import com.example.backend.repositories.BookRepository;
import com.example.backend.repositories.CartItemRepository;
import com.example.backend.repositories.CartRepository;
import com.example.backend.repositories.OrderItemRepository;
import com.example.backend.repositories.OrdersRepository;
import com.example.backend.repositories.PaymentRepository;
import com.example.backend.repositories.UserAddressRepository;
import com.example.backend.repositories.UserRepository;

// --- VNPAY REFACTOR START: checkout service creates order first, then VNPay handles online payment ---
@Service
public class OrderCheckoutService {

    // --- VNPAY REFACTOR START: centralize final order/payment method values saved in DB ---
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_PROCESSING = "PROCESSING";
    private static final String PAYMENT_METHOD_COD = "COD";
    private static final String PAYMENT_METHOD_VNPAY = "VNPAY";
    // --- VNPAY REFACTOR END: centralize final order/payment method values saved in DB ---

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final BookRepository bookRepository;
    private final OrdersRepository ordersRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    public OrderCheckoutService(UserRepository userRepository,
            UserAddressRepository userAddressRepository,
            BookRepository bookRepository,
            OrdersRepository ordersRepository,
            OrderItemRepository orderItemRepository,
            PaymentRepository paymentRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository) {
        this.userRepository = userRepository;
        this.userAddressRepository = userAddressRepository;
        this.bookRepository = bookRepository;
        this.ordersRepository = ordersRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
    }

    @Transactional
    public PlaceOrderResponse placeOrder(String email, PlaceOrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.getAddressId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address is required");
        }

        Useraddress address = userAddressRepository.findActiveByIdAndUser(request.getAddressId(), user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Address not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order must have at least one item");
        }

        String normalizedPaymentMethod = normalizePaymentMethod(request.getPaymentMethod());
        boolean isOnlineCheckout = "wallet".equals(normalizedPaymentMethod);

        Long orderId = ordersRepository.findTopByOrderByIdDesc()
                .map(Order::getId)
                .orElse(0L) + 1L;

        Order order = new Order();
        order.setId(orderId);
        order.setUserID(user);
        order.setAddressID(address);
        order.setPaymentMethod(isOnlineCheckout ? PAYMENT_METHOD_VNPAY : PAYMENT_METHOD_COD);
        order.setNote(request.getNote());
        order.setCreatedAt(OffsetDateTime.now());
        order.setShippingFee(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<Orderitem> lineItems = new ArrayList<>();

        for (PlaceOrderRequest.ItemPayload payload : request.getItems()) {
            Book book = bookRepository.findById(payload.getBookId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Book not found: " + payload.getBookId()));

            Integer requestedQuantity = payload.getQuantity();
            int quantity = (requestedQuantity != null && requestedQuantity > 0)
                ? requestedQuantity
                    : 1;

            BigDecimal unitPrice = calculateFinalPrice(book);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
            totalAmount = totalAmount.add(lineTotal);

            OrderitemId orderItemId = new OrderitemId();
            orderItemId.setOrderid(orderId);
            orderItemId.setBookid(book.getId());

            Orderitem orderItem = new Orderitem();
            orderItem.setId(orderItemId);
            orderItem.setOrderID(order);
            orderItem.setBookID(book);
            orderItem.setQuantity(quantity);
            orderItem.setPrice(unitPrice);

            lineItems.add(orderItem);
        }

        // --- VNPAY REFACTOR START: COD goes straight to processing, online payment stays pending until VNPay return success ---
        order.setTotalAmount(totalAmount);
        order.setCurrentStatus(isOnlineCheckout ? STATUS_PENDING : STATUS_PROCESSING);
        // --- VNPAY REFACTOR END: COD goes straight to processing, online payment stays pending until VNPay return success ---

        ordersRepository.save(order);
        orderItemRepository.saveAll(lineItems);

        createPaymentRecord(order, totalAmount, isOnlineCheckout);
        clearCartItems(user, request.getItems());

        return new PlaceOrderResponse(orderId, order.getCurrentStatus());
    }

    private void createPaymentRecord(Order order, BigDecimal amount, boolean isOnlineCheckout) {
        Long paymentId = paymentRepository.findTopByOrderByIdDesc()
                .map(Payment::getId)
                .orElse(0L) + 1L;

        Payment payment = new Payment();
        payment.setId(paymentId);
        payment.setOrderID(order);
        payment.setAmount(amount);
        payment.setProvider(isOnlineCheckout ? PAYMENT_METHOD_VNPAY : PAYMENT_METHOD_COD);
        payment.setStatus(isOnlineCheckout ? "Pending" : "Success");
        payment.setPaymentDate(OffsetDateTime.now());
        payment.setTransactionCode(null);

        paymentRepository.save(payment);
    }

    private BigDecimal calculateFinalPrice(Book book) {
        int discount = book.getPromotionBooks().stream()
                .map(Promotionbook::getPromotionID)
                .filter(Objects::nonNull)
                .map(Promotion::getDiscountPercent)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(0);

        BigDecimal discountRate = BigDecimal.valueOf(1 - discount / 100.0);
        return book.getPrice().multiply(discountRate);
    }

    private void clearCartItems(User user, List<PlaceOrderRequest.ItemPayload> items) {
        Cart cart = cartRepository.findByUserID(user).orElse(null);
        if (cart == null) {
            return;
        }

        for (PlaceOrderRequest.ItemPayload item : items) {
            cartItemRepository.deleteByIdCartidAndIdBookid(cart.getId(), item.getBookId());
        }
    }

    private String normalizePaymentMethod(String method) {
        if (method == null || method.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment method is required");
        }

        String normalized = method.trim().toLowerCase(Locale.ROOT);
        if (!List.of("cod", "wallet").contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment method: " + method);
        }
        return normalized;
    }
}
// --- VNPAY REFACTOR END: checkout service creates order first, then VNPay handles online payment ---
