package com.example.backend.dto.requests;

import lombok.Data;

// --- ORDER ACTION REFACTOR START: payload for user cancel/return order requests ---
@Data
public class OrderActionRequest {
    private String reason;
}
// --- ORDER ACTION REFACTOR END: payload for user cancel/return order requests ---
