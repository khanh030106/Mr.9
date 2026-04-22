package com.example.backend.dto.responseModel.admin;

import java.util.List;

public record AdminCategoryPageResponse(
        List<AdminCategoryResponse> content,
        int page,
        int size,
        int totalPages,
        long totalElements
) {
    // --- ADMIN CATEGORY MANAGEMENT START/END: wrapper response for paginated categories ---
}
