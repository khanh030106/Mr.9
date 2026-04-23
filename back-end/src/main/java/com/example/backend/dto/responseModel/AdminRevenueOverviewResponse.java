package com.example.backend.dto.responseModel;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// --- ADMIN REVENUE START: response model for admin revenue dashboard ---
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminRevenueOverviewResponse {
    private int year;
    private int month;

    private int categoryPage;
    private int categorySize;
    private int categoryTotalPages;
    private long categoryTotalElements;

    private RevenueSummary summary;
    private List<CategoryRevenueRow> categoryRows;
    private List<RevenueTrendPoint> trendByDay;
    private List<CategoryContribution> contributions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueSummary {
        private BigDecimal totalRevenue;
        private long totalQuantitySold;
        private BigDecimal averageOrderValue;
        private long newCustomers;

        private BigDecimal revenueGrowthPercent;
        private BigDecimal quantityGrowthPercent;
        private BigDecimal averageOrderValueGrowthPercent;
        private BigDecimal newCustomersGrowthPercent;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryRevenueRow {
        private Long categoryId;
        private String categoryName;
        private BigDecimal totalRevenue;
        private long totalQuantity;
        private BigDecimal highestPrice;
        private BigDecimal lowestPrice;
        private BigDecimal averagePrice;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueTrendPoint {
        private int dayOfMonth;
        private String label;
        private BigDecimal revenue;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryContribution {
        private Long categoryId;
        private String categoryName;
        private BigDecimal totalRevenue;
        private BigDecimal percentage;
    }
}
// --- ADMIN REVENUE END: response model for admin revenue dashboard ---
