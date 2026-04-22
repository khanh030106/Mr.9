package com.example.backend.dto.requests.admin;

import java.time.LocalDate;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUserUpdateRequest {
    // --- ADMIN USER MANAGEMENT START: payload for admin user update ---
    @Size(max = 50, message = "Full name must be <= 50 characters")
    private String fullName;

    @Size(max = 20, message = "Phone must be <= 20 characters")
    private String phone;

    @Size(max = 20, message = "Gender must be <= 20 characters")
    private String gender;

    private LocalDate dateOfBirth;

    private String roleName;

    private Boolean isActive;
    // --- ADMIN USER MANAGEMENT END: payload for admin user update ---
}
