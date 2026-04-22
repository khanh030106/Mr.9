package com.example.backend.dto.responseModel.admin;

import java.util.List;

public record AdminUserOptionsResponse(
        List<OptionItem> roles
) {
    // --- ADMIN USER MANAGEMENT START: response for user management form/filter options ---
    public record OptionItem(String value, String label) {}
    // --- ADMIN USER MANAGEMENT END: response for user management form/filter options ---
}
