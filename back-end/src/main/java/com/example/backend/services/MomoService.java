package com.example.backend.services;

import com.example.backend.configs.MomoConfig;
import com.example.backend.dto.responseModel.CreateCheckoutSessionResponse;
import com.example.backend.entities.Order;
import com.example.backend.entities.Payment;
import com.example.backend.repositories.OrdersRepository;
import com.example.backend.repositories.PaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;

@Service
@ConditionalOnProperty(name = "momo.enabled", havingValue = "true")
public class MomoService {

    private static final Logger log = LoggerFactory.getLogger(MomoService.class);

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_PROCESSING = "PROCESSING";
    private static final String PAYMENT_METHOD_MOMO = "MOMO";

    private final OrdersRepository ordersRepository;
    private final PaymentRepository paymentRepository;
    private final MomoConfig momoConfig;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.backend-url}")
    private String backendUrl;

    public MomoService(OrdersRepository ordersRepository,
                       PaymentRepository paymentRepository,
                       MomoConfig momoConfig) {
        this.ordersRepository = ordersRepository;
        this.paymentRepository = paymentRepository;
        this.momoConfig = momoConfig;
        this.objectMapper = new ObjectMapper();
        this.httpClient = HttpClient.newHttpClient();
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

        if (!PAYMENT_METHOD_MOMO.equalsIgnoreCase(order.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order is not using MoMo payment");
        }

        if (!STATUS_PENDING.equalsIgnoreCase(order.getCurrentStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending online-payment orders can open checkout");
        }

        Payment payment = paymentRepository.findTopByOrderID_IdOrderByIdDesc(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment record not found"));

        validateMomoConfig();

        long amount = toMomoAmount(order.getTotalAmount());
        String requestOrderId = String.valueOf(order.getId());
        String requestId = "REQ-" + order.getId() + "-" + System.currentTimeMillis();
        String orderInfo = buildOrderInfo(order.getId());
        String redirectUrl = frontendUrl + "/bookseller/order";
        String ipnUrl = backendUrl + "/api/payment/webhook";
        String requestType = "captureWallet";
        String extraData = "";

        String rawSignature = "accessKey=" + momoConfig.getAccessKey()
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + requestOrderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + momoConfig.getPartnerCode()
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        try {
            JsonNode payload = objectMapper.createObjectNode()
                    .put("partnerCode", momoConfig.getPartnerCode())
                    .put("partnerName", "BookStore")
                    .put("storeId", "BookStore")
                    .put("requestId", requestId)
                    .put("amount", amount)
                    .put("orderId", requestOrderId)
                    .put("orderInfo", orderInfo)
                    .put("redirectUrl", redirectUrl)
                    .put("ipnUrl", ipnUrl)
                    .put("lang", "vi")
                    .put("requestType", requestType)
                    .put("autoCapture", true)
                    .put("extraData", extraData)
                    .put("signature", hmacSha256(rawSignature, momoConfig.getSecretKey()));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(momoConfig.getEndpoint()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode responseJson = objectMapper.readTree(response.body());

            int resultCode = responseJson.path("resultCode").asInt(-1);
            String message = responseJson.path("message").asText("Unable to create MoMo payment");
            if (response.statusCode() < 200 || response.statusCode() >= 300 || resultCode != 0) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, message);
            }

            String payUrl = responseJson.path("payUrl").asText(null);
            if (payUrl == null || payUrl.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "MoMo response does not contain payUrl");
            }

            String transRequestId = responseJson.path("requestId").asText(requestId);
            payment.setTransactionCode(transRequestId);
            payment.setResponseData(payUrl);
            paymentRepository.save(payment);

            return new CreateCheckoutSessionResponse(transRequestId, payUrl);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("MoMo payment creation interrupted for orderId={}", orderId, ex);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create MoMo checkout session", ex);
        } catch (IOException | RuntimeException ex) {
            log.error("MoMo payment creation failed for orderId={}: {}", orderId, ex.getMessage(), ex);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unable to create MoMo checkout session", ex);
        }
    }

    @Transactional
    public void handleWebhook(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            long orderId = parseOrderId(root.path("orderId").asText(null));
            if (orderId <= 0) {
                return;
            }

            int resultCode = root.path("resultCode").asInt(-1);
            String transId = root.path("transId").asText(null);

            Order order = ordersRepository.findById(orderId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

            Payment payment = paymentRepository.findTopByOrderID_IdOrderByIdDesc(orderId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment record not found"));

            payment.setPaymentDate(OffsetDateTime.now());
            payment.setResponseData(payload);

            if (resultCode == 0) {
                payment.setStatus("Success");
                if (transId != null && !transId.isBlank()) {
                    payment.setTransactionCode(transId);
                }
                order.setCurrentStatus(STATUS_PROCESSING);
                order.setCanceledReason(null);
                order.setCanceledAt(null);
                ordersRepository.save(order);
            } else {
                payment.setStatus("Canceled");
            }

            paymentRepository.save(payment);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (IOException | RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid MoMo webhook payload", ex);
        }
    }

    private long parseOrderId(String orderIdRaw) {
        if (orderIdRaw == null || orderIdRaw.isBlank()) {
            return 0L;
        }
        try {
            return Long.parseLong(orderIdRaw.trim());
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    private void validateMomoConfig() {
        if (isBlankOrPlaceholder(momoConfig.getPartnerCode())
                || isBlankOrPlaceholder(momoConfig.getAccessKey())
                || isBlankOrPlaceholder(momoConfig.getSecretKey())) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "MoMo is not configured. Please set MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY in environment."
            );
        }
    }

    private boolean isBlankOrPlaceholder(String value) {
        return value == null || value.isBlank() || value.contains("replace_me");
    }

    private long toMomoAmount(BigDecimal amount) {
        if (amount == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order total is missing");
        }

        BigDecimal normalized = amount.setScale(0, RoundingMode.HALF_UP);
        if (normalized.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order total must be greater than zero");
        }
        return normalized.longValueExact();
    }

    private String buildOrderInfo(Long orderId) {
        String value = "Thanh toan don hang #" + orderId;
        return value.length() <= 120 ? value : value.substring(0, 120);
    }

    private String hmacSha256(String raw, String secretKey) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmac.init(keySpec);
            byte[] bytes = hmac.doFinal(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to sign MoMo payload", ex);
        }
    }
}
