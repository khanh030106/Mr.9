package com.example.backend.services;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.configs.VnpayConfig;
import com.example.backend.dto.responseModel.CreateCheckoutSessionResponse;
import com.example.backend.entities.Order;
import com.example.backend.entities.Payment;
import com.example.backend.repositories.OrdersRepository;
import com.example.backend.repositories.PaymentRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

// --- VNPAY REFACTOR START: VNPay sandbox checkout + return signature verification + order status transition ---
@Service
public class VnpayService {

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_PROCESSING = "PROCESSING";
    private static final String PAYMENT_METHOD_VNPAY = "VNPAY";
    private static final DateTimeFormatter VNP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final OrdersRepository ordersRepository;
    private final PaymentRepository paymentRepository;
    private final VnpayConfig vnpayConfig;
    private final ObjectMapper objectMapper;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.backend-url}")
    private String backendUrl;

    public VnpayService(OrdersRepository ordersRepository,
                        PaymentRepository paymentRepository,
                        VnpayConfig vnpayConfig) {
        this.ordersRepository = ordersRepository;
        this.paymentRepository = paymentRepository;
        this.vnpayConfig = vnpayConfig;
        this.objectMapper = new ObjectMapper();
    }

    @Transactional
    public CreateCheckoutSessionResponse createCheckoutSession(String email, Long orderId) {
        if (orderId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order ID is required");
        }

        Order order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (!email.equalsIgnoreCase(order.getUserID().getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this order");
        }

        if (!PAYMENT_METHOD_VNPAY.equalsIgnoreCase(order.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not using VNPay payment");
        }

        if (!STATUS_PENDING.equalsIgnoreCase(order.getCurrentStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending online-payment orders can open checkout");
        }

        Payment payment = paymentRepository.findTopByOrderID_IdOrderByIdDesc(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment record not found"));

        validateVnpayConfig();

        String txnRef = order.getId() + "-" + System.currentTimeMillis();
        long amount = toVnpayAmount(order.getTotalAmount());

        OffsetDateTime now = OffsetDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        String createDate = now.format(VNP_DATE_FORMAT);
        String expireDate = now.plusMinutes(15).format(VNP_DATE_FORMAT);

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpayConfig.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", buildOrderInfo(order.getId()));
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", backendUrl + "/api/payment/vnpay-return");
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_ExpireDate", expireDate);

        String hashData = buildEncodedQuery(params);
        String secureHash = hmacSha512(vnpayConfig.getHashSecret(), hashData);
        String paymentUrl = vnpayConfig.getPayUrl() + "?" + hashData + "&vnp_SecureHash=" + secureHash;

        payment.setTransactionCode(txnRef);
        payment.setResponseData(paymentUrl);
        paymentRepository.save(payment);

        return new CreateCheckoutSessionResponse(txnRef, paymentUrl);
    }

    @Transactional
    public String handleReturn(Map<String, String> rawParams) {
        Map<String, String> callbackParams = new LinkedHashMap<>(rawParams == null ? Map.of() : rawParams);
        Long orderId = parseOrderId(callbackParams.get("vnp_TxnRef"));
        if (orderId == null) {
            return buildFrontendOrderUrl(null, "CANCELED");
        }

        Order order = ordersRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        Payment payment = paymentRepository.findTopByOrderID_IdOrderByIdDesc(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment record not found"));

        boolean isSignatureValid = verifySignature(callbackParams);
        boolean isPaid = isSignatureValid
                && "00".equals(callbackParams.get("vnp_ResponseCode"))
                && "00".equals(callbackParams.get("vnp_TransactionStatus"));

        payment.setPaymentDate(OffsetDateTime.now());
        payment.setTransactionCode(resolveTransactionCode(payment.getTransactionCode(), callbackParams.get("vnp_TransactionNo")));
        payment.setResponseData(serializeResponse(callbackParams));

        if (isPaid) {
            payment.setStatus("Success");
            order.setCurrentStatus(STATUS_PROCESSING);
            order.setCanceledReason(null);
            order.setCanceledAt(null);
            ordersRepository.save(order);
        } else {
            // Keep pending order state for canceled/failed VNPay payment attempts.
            payment.setStatus("Pending");
        }

        paymentRepository.save(payment);
        return buildFrontendOrderUrl(orderId, isPaid ? "SUCCESS" : "CANCELED");
    }

    private boolean verifySignature(Map<String, String> callbackParams) {
        validateVnpayConfig();

        String secureHash = callbackParams.get("vnp_SecureHash");
        if (secureHash == null || secureHash.isBlank()) {
            return false;
        }

        Map<String, String> dataToSign = new TreeMap<>();
        for (Map.Entry<String, String> entry : callbackParams.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key == null || key.isBlank()) {
                continue;
            }
            if ("vnp_SecureHash".equalsIgnoreCase(key) || "vnp_SecureHashType".equalsIgnoreCase(key)) {
                continue;
            }
            if (value == null || value.isBlank()) {
                continue;
            }
            dataToSign.put(key, value);
        }

        String signed = hmacSha512(vnpayConfig.getHashSecret(), buildEncodedQuery(dataToSign));
        return secureHash.equalsIgnoreCase(signed);
    }

    private String buildFrontendOrderUrl(Long orderId, String status) {
        StringBuilder builder = new StringBuilder(frontendUrl)
                .append("/bookseller/order?vnpayStatus=")
                .append(urlEncode(status));

        if (orderId != null) {
            builder.append("&orderId=").append(orderId);
        }

        return builder.toString();
    }

    private void validateVnpayConfig() {
        if (isBlankOrPlaceholder(vnpayConfig.getTmnCode()) || isBlankOrPlaceholder(vnpayConfig.getHashSecret())) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "VNPay is not configured. Please set VNPAY_TMN_CODE and VNPAY_HASH_SECRET in environment."
            );
        }
    }

    private String serializeResponse(Map<String, String> response) {
        try {
            return objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException ex) {
            return response.toString();
        }
    }

    private String resolveTransactionCode(String existingCode, String vnpTransactionNo) {
        if (vnpTransactionNo == null || vnpTransactionNo.isBlank()) {
            return existingCode;
        }
        return vnpTransactionNo;
    }

    private Long parseOrderId(String txnRef) {
        if (txnRef == null || txnRef.isBlank()) {
            return null;
        }

        String numericPart = txnRef;
        int separatorIndex = txnRef.indexOf('-');
        if (separatorIndex > 0) {
            numericPart = txnRef.substring(0, separatorIndex);
        }

        try {
            return Long.valueOf(numericPart.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private long toVnpayAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order total must be greater than zero");
        }

        BigDecimal multiplied = amount.multiply(BigDecimal.valueOf(100));
        return multiplied.longValue();
    }

    private String buildOrderInfo(Long orderId) {
        String value = "Thanh toan don hang #" + orderId;
        return value.length() <= 200 ? value : value.substring(0, 200);
    }

    private String buildEncodedQuery(Map<String, String> params) {
        StringBuilder builder = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key == null || key.isBlank() || value == null || value.isBlank()) {
                continue;
            }

            if (builder.length() > 0) {
                builder.append('&');
            }

            builder.append(urlEncode(key));
            builder.append('=');
            builder.append(urlEncode(value));
        }
        return builder.toString();
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(Objects.toString(value, ""), StandardCharsets.UTF_8)
                .replace("+", "%20");
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(secretKey);
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder(bytes.length * 2);
            for (byte item : bytes) {
                hex.append(String.format(Locale.ROOT, "%02x", item));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to sign VNPay payload", ex);
        }
    }

    private boolean isBlankOrPlaceholder(String value) {
        return value == null || value.isBlank() || value.contains("replace_me");
    }
}
// --- VNPAY REFACTOR END: VNPay sandbox checkout + return signature verification + order status transition ---
