package com.example.backend.dto.responseModel;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public class AdminOrderDetailResponse {
    private Long orderId;
    private String status;
    private String customerName;
    private String customerEmail;
    private String paymentMethod;
    private String note;
    private String canceledReason;
    private OffsetDateTime canceledAt;
    private OffsetDateTime createdAt;
    private BigDecimal shippingFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private boolean cancelRequested;
    private String cancelRequestReason;
    private boolean returnRequested;
    private String returnRequestReason;
    private AddressInfo address;
    private List<OrderItem> items;

    public AdminOrderDetailResponse() {
    }

    public AdminOrderDetailResponse(Long orderId, String status, String customerName, String customerEmail, String paymentMethod, String note, String canceledReason, OffsetDateTime canceledAt, OffsetDateTime createdAt, BigDecimal shippingFee, BigDecimal discountAmount, BigDecimal totalAmount, boolean cancelRequested, String cancelRequestReason, boolean returnRequested, String returnRequestReason, AddressInfo address, List<OrderItem> items) {
        this.orderId = orderId;
        this.status = status;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.paymentMethod = paymentMethod;
        this.note = note;
        this.canceledReason = canceledReason;
        this.canceledAt = canceledAt;
        this.createdAt = createdAt;
        this.shippingFee = shippingFee;
        this.discountAmount = discountAmount;
        this.totalAmount = totalAmount;
        this.cancelRequested = cancelRequested;
        this.cancelRequestReason = cancelRequestReason;
        this.returnRequested = returnRequested;
        this.returnRequestReason = returnRequestReason;
        this.address = address;
        this.items = items;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getCanceledReason() {
        return canceledReason;
    }

    public void setCanceledReason(String canceledReason) {
        this.canceledReason = canceledReason;
    }

    public OffsetDateTime getCanceledAt() {
        return canceledAt;
    }

    public void setCanceledAt(OffsetDateTime canceledAt) {
        this.canceledAt = canceledAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public BigDecimal getShippingFee() {
        return shippingFee;
    }

    public void setShippingFee(BigDecimal shippingFee) {
        this.shippingFee = shippingFee;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public boolean isCancelRequested() {
        return cancelRequested;
    }

    public void setCancelRequested(boolean cancelRequested) {
        this.cancelRequested = cancelRequested;
    }

    public String getCancelRequestReason() {
        return cancelRequestReason;
    }

    public void setCancelRequestReason(String cancelRequestReason) {
        this.cancelRequestReason = cancelRequestReason;
    }

    public boolean isReturnRequested() {
        return returnRequested;
    }

    public void setReturnRequested(boolean returnRequested) {
        this.returnRequested = returnRequested;
    }

    public String getReturnRequestReason() {
        return returnRequestReason;
    }

    public void setReturnRequestReason(String returnRequestReason) {
        this.returnRequestReason = returnRequestReason;
    }

    public AddressInfo getAddress() {
        return address;
    }

    public void setAddress(AddressInfo address) {
        this.address = address;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }

    public static class AddressInfo {
        private String receiverName;
        private String phone;
        private String addressLine;
        private String ward;
        private String district;
        private String province;

        public AddressInfo() {
        }

        public AddressInfo(String receiverName, String phone, String addressLine, String ward, String district, String province) {
            this.receiverName = receiverName;
            this.phone = phone;
            this.addressLine = addressLine;
            this.ward = ward;
            this.district = district;
            this.province = province;
        }

        public String getReceiverName() {
            return receiverName;
        }

        public void setReceiverName(String receiverName) {
            this.receiverName = receiverName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getAddressLine() {
            return addressLine;
        }

        public void setAddressLine(String addressLine) {
            this.addressLine = addressLine;
        }

        public String getWard() {
            return ward;
        }

        public void setWard(String ward) {
            this.ward = ward;
        }

        public String getDistrict() {
            return district;
        }

        public void setDistrict(String district) {
            this.district = district;
        }

        public String getProvince() {
            return province;
        }

        public void setProvince(String province) {
            this.province = province;
        }
    }

    public static class OrderItem {
        private Long bookId;
        private String title;
        private String authorName;
        private String imageUrl;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal lineTotal;

        public OrderItem() {
        }

        public OrderItem(Long bookId, String title, String authorName, String imageUrl, Integer quantity, BigDecimal price, BigDecimal lineTotal) {
            this.bookId = bookId;
            this.title = title;
            this.authorName = authorName;
            this.imageUrl = imageUrl;
            this.quantity = quantity;
            this.price = price;
            this.lineTotal = lineTotal;
        }

        public Long getBookId() {
            return bookId;
        }

        public void setBookId(Long bookId) {
            this.bookId = bookId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getAuthorName() {
            return authorName;
        }

        public void setAuthorName(String authorName) {
            this.authorName = authorName;
        }

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getPrice() {
            return price;
        }

        public void setPrice(BigDecimal price) {
            this.price = price;
        }

        public BigDecimal getLineTotal() {
            return lineTotal;
        }

        public void setLineTotal(BigDecimal lineTotal) {
            this.lineTotal = lineTotal;
        }
    }
}
