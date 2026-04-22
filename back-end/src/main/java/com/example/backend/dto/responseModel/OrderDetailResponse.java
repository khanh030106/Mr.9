package com.example.backend.dto.responseModel;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// --- ORDER DETAIL REFACTOR START: response payload for user order detail modal ---
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderDetailResponse {
    private Long orderId;
    private String status;
    private String paymentMethod;
    private String note;
    private String canceledReason;
    private OffsetDateTime canceledAt;
    private OffsetDateTime createdAt;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private AddressInfo address;
    private List<OrderItem> items;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AddressInfo {
        private String receiverName;
        private String phone;
        private String addressLine;
        private String ward;
        private String district;
        private String province;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderItem {
        private Long bookId;
        private String title;
        private String authorName;
        private String imageUrl;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal lineTotal;
    }
}
// --- ORDER DETAIL REFACTOR END: response payload for user order detail modal ---
