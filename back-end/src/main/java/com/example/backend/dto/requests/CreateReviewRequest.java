package com.example.backend.dto.requests;

import lombok.Data;

// --- REVIEW COMMENT REFACTOR START: payload for creating product feedback ---
@Data
public class CreateReviewRequest {
    private String comment;
    private Integer rating;
}
// --- REVIEW COMMENT REFACTOR END: payload for creating product feedback ---
