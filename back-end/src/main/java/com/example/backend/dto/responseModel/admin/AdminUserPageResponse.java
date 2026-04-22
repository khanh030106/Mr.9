package com.example.backend.dto.responseModel.admin;

import java.util.List;

public record AdminUserPageResponse(
        List<AdminUserResponse> content,
        int page,
        int size,
        int totalPages,
        long totalElements
) {
    // --- ADMIN USER MANAGEMENT START/END: wrapper response for paginated users ---
}
