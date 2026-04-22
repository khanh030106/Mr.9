package com.example.backend.dto.requests.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminCategoryUpsertRequest {
    // --- ADMIN CATEGORY MANAGEMENT START: validated payload for create/update category ---
    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name must be <= 100 characters")
    private String categoryName;

    private Long parentId;
    // --- ADMIN CATEGORY MANAGEMENT END: validated payload for create/update category ---
}
