package com.example.backend.dto.responseModel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OrderListResponse {
    private List<OrderSummary> orders;
    private Map<String, Long> counts;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OrderSummary {
        private Long orderId;
        private String status;
        private BigDecimal totalAmount;
        private OffsetDateTime createdAt;
        private List<OrderItem> items;
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

