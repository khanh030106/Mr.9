package com.example.backend.dto.responseModel;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String avatar;
    private String phone;
    private String dateOfBirth;
    private String gender;
    private String backgroundImage;
    private List<String> role;
}
