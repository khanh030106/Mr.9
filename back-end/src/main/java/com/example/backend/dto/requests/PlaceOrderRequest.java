package com.example.backend.dto.requests;

import lombok.Data;

import java.util.List;

// --- STRIPE REFACTOR START: request DTO for placing an order at checkout ---
@Data
public class PlaceOrderRequest {
    private Long addressId;
    private String paymentMethod; // "cod" | "wallet"
    private String note;
    private List<ItemPayload> items;

    @Data
    public static class ItemPayload {
        private Long bookId;
        private Integer quantity;
    }
}
// --- STRIPE REFACTOR END: request DTO for placing an order at checkout ---
