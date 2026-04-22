package com.example.backend.dto.responseModel.admin;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminUserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String gender,
        LocalDate dateOfBirth,
        String avatar,
        boolean active,
        boolean deleted,
        OffsetDateTime createdAt,
        List<String> roles
) {
    // --- ADMIN USER MANAGEMENT START/END: response model for admin user APIs ---
}
