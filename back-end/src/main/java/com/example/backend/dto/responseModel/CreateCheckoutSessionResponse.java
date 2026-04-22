package com.example.backend.dto.responseModel;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// --- STRIPE REFACTOR START: response returned after creating Stripe Checkout Session ---
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateCheckoutSessionResponse {
    private String sessionId;
    private String sessionUrl;
}
// --- STRIPE REFACTOR END: response returned after creating Stripe Checkout Session ---
