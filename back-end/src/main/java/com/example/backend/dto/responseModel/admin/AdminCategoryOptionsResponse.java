package com.example.backend.dto.responseModel.admin;

import java.util.List;

public record AdminCategoryOptionsResponse(
        List<OptionItem> categories
) {
    // --- ADMIN CATEGORY MANAGEMENT START: response for category form options ---
    public record OptionItem(Long id, String name) {}
    // --- ADMIN CATEGORY MANAGEMENT END: response for category form options ---
}
