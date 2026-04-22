package com.example.backend.dto.requests.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUserCreateRequest {
    // --- ADMIN USER MANAGEMENT START: validated payload for admin user creation ---
    @NotBlank(message = "Full name is required")
    @Size(max = 50, message = "Full name must be <= 50 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    @Size(max = 255, message = "Email must be <= 255 characters")
    private String email;

    @Size(max = 20, message = "Phone must be <= 20 characters")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Role is required")
    private String roleName;

    @NotNull(message = "Active status is required")
    private Boolean isActive;
    // --- ADMIN USER MANAGEMENT END: validated payload for admin user creation ---
}
