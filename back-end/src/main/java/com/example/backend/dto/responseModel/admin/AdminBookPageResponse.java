package com.example.backend.dto.responseModel.admin;

import java.util.List;

public record AdminBookPageResponse(
        List<AdminBookResponse> content,
        int page,
        int size,
        int totalPages,
        long totalElements
) {
    // --- ADMIN BOOK MANAGEMENT START/END: wrapper response for paginated admin books ---
}
