package com.example.backend.dto.responseModel;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CartItemResponse {
    private Long bookId;
    private String title;
    private String imageUrl;
    private String authorName;
    private BigDecimal price;
    private BigDecimal finalPrice;
    private Integer discountPercent;
    private Integer quantity;
}
