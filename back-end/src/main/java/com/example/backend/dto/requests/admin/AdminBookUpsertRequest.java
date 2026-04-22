package com.example.backend.dto.requests.admin;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminBookUpsertRequest {
    // --- ADMIN BOOK MANAGEMENT START: validated payload for create/update book ---
    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be <= 255 characters")
    private String title;

    @Size(max = 50, message = "ISBN must be <= 50 characters")
    private String isbn;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Price must be >= 0")
    private BigDecimal price;

    @PositiveOrZero(message = "Quantity must be >= 0")
    private Integer quantity;

    @PositiveOrZero(message = "Publish year must be >= 0")
    private Integer publishYear;

    @Size(max = 50, message = "Language must be <= 50 characters")
    private String language;

    private Long publisherId;

    private Boolean isActive;

    private List<Long> categoryIds;

    private List<Long> authorIds;
    // --- ADMIN BOOK MANAGEMENT END: validated payload for create/update book ---
}
