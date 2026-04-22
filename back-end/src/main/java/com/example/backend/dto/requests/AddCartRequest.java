package com.example.backend.dto.requests;

import lombok.Data;

@Data
public class AddCartRequest {
    private Long bookId;
    private Integer quantity;
}
