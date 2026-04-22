package com.example.backend.dto.responseModel.admin;

public record AdminCategoryResponse(
        Long id,
        String categoryName,
        Long parentId,
        String parentName,
        boolean deleted,
        long totalBooks
) {
    // --- ADMIN CATEGORY MANAGEMENT START/END: response model for admin category APIs ---
}
