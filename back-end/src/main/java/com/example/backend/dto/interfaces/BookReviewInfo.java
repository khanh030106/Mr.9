package com.example.backend.dto.interfaces;

import java.time.OffsetDateTime;

public interface BookReviewInfo {
    Long getReviewId();
    Long getUserId();
    String getReviewerName();
    String getReviewerAvatar();
    Integer getRating();
    String getComment();
    OffsetDateTime getCreatedAt();
}

