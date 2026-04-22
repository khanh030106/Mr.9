package com.example.backend.dto.responseModel.admin;

import java.util.List;

public record AdminBookOptionsResponse(
        List<OptionItem> publishers,
        List<OptionItem> authors,
        List<OptionItem> categories
) {
    // --- ADMIN BOOK MANAGEMENT START: response for add/edit form option data ---
    public record OptionItem(Long id, String name) {}
    // --- ADMIN BOOK MANAGEMENT END: response for add/edit form option data ---
}
