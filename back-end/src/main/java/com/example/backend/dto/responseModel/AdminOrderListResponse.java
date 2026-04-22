package com.example.backend.dto.responseModel;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class AdminOrderListResponse {
    private List<OrderRow> content;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
    private Stats stats;

    public AdminOrderListResponse() {
    }

    public AdminOrderListResponse(List<OrderRow> content, int page, int size, int totalPages, long totalElements, Stats stats) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalPages = totalPages;
        this.totalElements = totalElements;
        this.stats = stats;
    }

    public List<OrderRow> getContent() {
        return content;
    }

    public void setContent(List<OrderRow> content) {
        this.content = content;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public Stats getStats() {
        return stats;
    }

    public void setStats(Stats stats) {
        this.stats = stats;
    }

    public static class OrderRow {
        private Long orderId;
        private String customerName;
        private String customerEmail;
        private OffsetDateTime createdAt;
        private BigDecimal totalAmount;
        private String status;
        private boolean cancelRequested;
        private boolean returnRequested;

        public OrderRow() {
        }

        public OrderRow(Long orderId, String customerName, String customerEmail, OffsetDateTime createdAt, BigDecimal totalAmount, String status, boolean cancelRequested, boolean returnRequested) {
            this.orderId = orderId;
            this.customerName = customerName;
            this.customerEmail = customerEmail;
            this.createdAt = createdAt;
            this.totalAmount = totalAmount;
            this.status = status;
            this.cancelRequested = cancelRequested;
            this.returnRequested = returnRequested;
        }

        public Long getOrderId() {
            return orderId;
        }

        public void setOrderId(Long orderId) {
            this.orderId = orderId;
        }

        public String getCustomerName() {
            return customerName;
        }

        public void setCustomerName(String customerName) {
            this.customerName = customerName;
        }

        public String getCustomerEmail() {
            return customerEmail;
        }

        public void setCustomerEmail(String customerEmail) {
            this.customerEmail = customerEmail;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public BigDecimal getTotalAmount() {
            return totalAmount;
        }

        public void setTotalAmount(BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public boolean isCancelRequested() {
            return cancelRequested;
        }

        public void setCancelRequested(boolean cancelRequested) {
            this.cancelRequested = cancelRequested;
        }

        public boolean isReturnRequested() {
            return returnRequested;
        }

        public void setReturnRequested(boolean returnRequested) {
            this.returnRequested = returnRequested;
        }
    }

    public static class Stats {
        private long totalOrders;
        private long pendingOrders;
        private BigDecimal revenueToday;

        public Stats() {
        }

        public Stats(long totalOrders, long pendingOrders, BigDecimal revenueToday) {
            this.totalOrders = totalOrders;
            this.pendingOrders = pendingOrders;
            this.revenueToday = revenueToday;
        }

        public long getTotalOrders() {
            return totalOrders;
        }

        public void setTotalOrders(long totalOrders) {
            this.totalOrders = totalOrders;
        }

        public long getPendingOrders() {
            return pendingOrders;
        }

        public void setPendingOrders(long pendingOrders) {
            this.pendingOrders = pendingOrders;
        }

        public BigDecimal getRevenueToday() {
            return revenueToday;
        }

        public void setRevenueToday(BigDecimal revenueToday) {
            this.revenueToday = revenueToday;
        }
    }
}
