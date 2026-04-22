package com.example.backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.requests.admin.AdminUserCreateRequest;
import com.example.backend.dto.requests.admin.AdminUserStatusRequest;
import com.example.backend.dto.requests.admin.AdminUserUpdateRequest;
import com.example.backend.dto.responseModel.admin.AdminUserOptionsResponse;
import com.example.backend.dto.responseModel.admin.AdminUserPageResponse;
import com.example.backend.dto.responseModel.admin.AdminUserResponse;
import com.example.backend.services.AdminUserManagementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserManagementController {
    // --- ADMIN USER MANAGEMENT START: REST endpoints for admin user management ---
    private final AdminUserManagementService adminUserManagementService;

    public AdminUserManagementController(AdminUserManagementService adminUserManagementService) {
        this.adminUserManagementService = adminUserManagementService;
    }

    @GetMapping
    public ResponseEntity<AdminUserPageResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isDeleted
    ) {
        return ResponseEntity.ok(adminUserManagementService.getUsers(page, size, keyword, role, isActive, isDeleted));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserResponse> getUserDetail(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserManagementService.getUserDetail(userId));
    }

    @GetMapping("/options")
    public ResponseEntity<AdminUserOptionsResponse> getUserOptions() {
        return ResponseEntity.ok(adminUserManagementService.getUserOptions());
    }

    @PostMapping
    public ResponseEntity<AdminUserResponse> createUser(@Valid @RequestBody AdminUserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserManagementService.createUser(request));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<AdminUserResponse> updateUser(@PathVariable Long userId,
                                                        @Valid @RequestBody AdminUserUpdateRequest request) {
        return ResponseEntity.ok(adminUserManagementService.updateUser(userId, request));
    }

    @PatchMapping("/{userId}/status")
    public ResponseEntity<AdminUserResponse> setUserStatus(@PathVariable Long userId,
                                                           @Valid @RequestBody AdminUserStatusRequest request) {
        return ResponseEntity.ok(adminUserManagementService.setUserEnabled(userId, Boolean.TRUE.equals(request.getIsActive())));
    }

    @PatchMapping("/{userId}/soft-delete")
    public ResponseEntity<AdminUserResponse> softDelete(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserManagementService.softDeleteUser(userId));
    }

    @PatchMapping("/{userId}/restore")
    public ResponseEntity<AdminUserResponse> restore(@PathVariable Long userId) {
        return ResponseEntity.ok(adminUserManagementService.restoreUser(userId));
    }
    // --- ADMIN USER MANAGEMENT END: REST endpoints for admin user management ---
}
