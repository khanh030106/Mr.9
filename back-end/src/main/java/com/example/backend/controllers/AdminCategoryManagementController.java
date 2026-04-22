package com.example.backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.requests.admin.AdminCategoryUpsertRequest;
import com.example.backend.dto.responseModel.admin.AdminCategoryOptionsResponse;
import com.example.backend.dto.responseModel.admin.AdminCategoryPageResponse;
import com.example.backend.dto.responseModel.admin.AdminCategoryResponse;
import com.example.backend.services.AdminCategoryManagementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/categories")
public class AdminCategoryManagementController {
    // --- ADMIN CATEGORY MANAGEMENT START: REST endpoints for admin category CRUD/list/search ---
    private final AdminCategoryManagementService adminCategoryManagementService;

    public AdminCategoryManagementController(AdminCategoryManagementService adminCategoryManagementService) {
        this.adminCategoryManagementService = adminCategoryManagementService;
    }

    @PostMapping
    public ResponseEntity<AdminCategoryResponse> createCategory(@Valid @RequestBody AdminCategoryUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminCategoryManagementService.createCategory(request));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<AdminCategoryResponse> updateCategory(@PathVariable Long categoryId,
                                                                @Valid @RequestBody AdminCategoryUpsertRequest request) {
        return ResponseEntity.ok(adminCategoryManagementService.updateCategory(categoryId, request));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long categoryId) {
        adminCategoryManagementService.deleteCategory(categoryId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<AdminCategoryResponse> getCategoryDetail(@PathVariable Long categoryId) {
        return ResponseEntity.ok(adminCategoryManagementService.getCategoryDetail(categoryId));
    }

    @GetMapping
    public ResponseEntity<AdminCategoryPageResponse> getCategories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean includeDeleted
    ) {
        return ResponseEntity.ok(adminCategoryManagementService.getCategories(page, size, keyword, includeDeleted));
    }

    @GetMapping("/options")
    public ResponseEntity<AdminCategoryOptionsResponse> getCategoryOptions() {
        return ResponseEntity.ok(adminCategoryManagementService.getCategoryOptions());
    }
    // --- ADMIN CATEGORY MANAGEMENT END: REST endpoints for admin category CRUD/list/search ---
}
