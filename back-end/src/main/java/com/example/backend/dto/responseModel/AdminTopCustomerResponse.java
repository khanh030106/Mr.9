package com.example.backend.dto.responseModel;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// --- ADMIN TOP CUSTOMER START: response model for admin top-customer dashboard ---
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminTopCustomerResponse {
    private String period;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;

    private List<TopCustomerRow> podium;
    private List<TopCustomerRow> rankings;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopCustomerRow {
        private Long userId;
        private int rank;
        private String customerName;
        private String customerEmail;
        private String avatar;
        private long totalOrders;
        private BigDecimal averageOrderValue;
        private BigDecimal totalSpend;
    }
}
// --- ADMIN TOP CUSTOMER END: response model for admin top-customer dashboard ---
