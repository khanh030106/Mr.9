package com.example.backend.dto.responseModel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// --- STRIPE REFACTOR START: response DTO returned after placing an order ---
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlaceOrderResponse {
    private Long orderId;
    private String orderStatus;
}
// --- STRIPE REFACTOR END: response DTO returned after placing an order ---
