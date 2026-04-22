package com.example.backend.dto.responseModel.admin;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminBookResponse(
        Long id,
        String title,
        String slug,
        String isbn,
        String imageUrl,
        String description,
        BigDecimal price,
        Integer quantity,
        Integer soldCount,
        Long publisherId,
        String publisherName,
        Integer publishYear,
        String language,
        Boolean isActive,
        Boolean isDeleted,
        OffsetDateTime createdAt,
        List<Long> categoryIds,
        List<String> categories,
        List<Long> authorIds,
        List<String> authors
) {
    // --- ADMIN BOOK MANAGEMENT START/END: response model for admin book detail/list rows ---
}
