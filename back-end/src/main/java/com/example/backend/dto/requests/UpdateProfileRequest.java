package com.example.backend.dto.requests;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String dateOfBirth;
    private String gender;
}
