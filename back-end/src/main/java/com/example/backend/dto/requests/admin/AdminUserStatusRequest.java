package com.example.backend.dto.requests.admin;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminUserStatusRequest {
    // --- ADMIN USER MANAGEMENT START: payload for enable/disable user ---
    @NotNull(message = "isActive is required")
    private Boolean isActive;
    // --- ADMIN USER MANAGEMENT END: payload for enable/disable user ---
}
