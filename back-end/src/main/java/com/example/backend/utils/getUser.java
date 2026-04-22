package com.example.backend.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.requests.UpdateProfileRequest;
import com.example.backend.dto.responseModel.UserResponse;
import com.example.backend.entities.User;
import com.example.backend.repositories.UserRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class getUser {
    private final UserRepository userRepository;

    @Value("${app.user-image-dir:src/main/resources/static/userImages}")
    private String userImageDir;

    @GetMapping("/auth/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));

        return ResponseEntity.ok(toUserResponse(user));
    }
    
    @PatchMapping("/auth/profile")
    public ResponseEntity<UserResponse> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request
    ) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));

        if (request.getFullName() != null) {
            String nextName = request.getFullName().trim();
            if (nextName.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Full name is required");
            }
            user.setFullName(nextName);
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getGender() != null) {
            user.setGender(request.getGender().trim());
        }

        if (request.getDateOfBirth() != null) {
            String dob = request.getDateOfBirth().trim();
            user.setDateofBirth(dob.isEmpty() ? null : LocalDate.parse(dob));
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(toUserResponse(saved));
    }
    // --- END FIX: API cập nhật profile user ---

    // --- PROFILE AVATAR REFACTOR START: API upload avatar image for authenticated user profile ---
    @PostMapping(value = "/auth/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserResponse> uploadAvatar(
            Authentication authentication,
            @RequestParam("avatarFile") MultipartFile avatarFile
    ) {
        if (avatarFile == null || avatarFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar file is required");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));

        String contentType = avatarFile.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }

        if (avatarFile.getSize() > 5 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Avatar size must be <= 5MB");
        }

        try {
            Path uploadDir = Paths.get(userImageDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            String extension = getFileExtension(avatarFile.getOriginalFilename());
            String fileName = "avatar-" + user.getId() + "-" + OffsetDateTime.now().toEpochSecond() + "-" + UUID.randomUUID() + extension;

            Path target = uploadDir.resolve(fileName).normalize();
            avatarFile.transferTo(target);

            user.setAvatar(fileName);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(toUserResponse(saved));
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload avatar", ex);
        }
    }
    // --- PROFILE AVATAR REFACTOR END: API upload avatar image for authenticated user profile ---

    private String getFileExtension(String fileName) {
        String safeName = StringUtils.hasText(fileName) ? fileName : "avatar.jpg";
        int dot = safeName.lastIndexOf('.');
        if (dot < 0 || dot == safeName.length() - 1) {
            return ".jpg";
        }

        String ext = safeName.substring(dot).toLowerCase(Locale.ROOT);
        return switch (ext) {
            case ".jpg", ".jpeg", ".png", ".webp", ".gif" -> ext;
            default -> ".jpg";
        };
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getAvatar(),
                user.getPhone(),
                user.getDateofBirth() != null ? user.getDateofBirth().toString() : null,
                user.getGender(),
                user.getBackgroundImage(),
                user.getUserRoles().stream()
                        .map(userRole -> userRole.getRoleID().getRoleName())
                        .toList()
        );
    }
}
