package com.example.backend.dto.requests;

import lombok.Data;

// --- STRIPE REFACTOR START: payload used to open a Stripe Checkout Session for an existing order ---
@Data
public class CreateCheckoutSessionRequest {
    private Long orderId;
}
// --- STRIPE REFACTOR END: payload used to open a Stripe Checkout Session for an existing order ---
