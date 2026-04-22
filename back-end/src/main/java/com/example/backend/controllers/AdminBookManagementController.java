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

import com.example.backend.dto.requests.admin.AdminBookUpsertRequest;
import com.example.backend.dto.responseModel.admin.AdminBookOptionsResponse;
import com.example.backend.dto.responseModel.admin.AdminBookPageResponse;
import com.example.backend.dto.responseModel.admin.AdminBookResponse;
import com.example.backend.services.AdminBookManagementService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/books")
public class AdminBookManagementController {
    // --- ADMIN BOOK MANAGEMENT START: REST endpoints for admin book CRUD/list/filter ---
    private final AdminBookManagementService adminBookManagementService;

    public AdminBookManagementController(AdminBookManagementService adminBookManagementService) {
        this.adminBookManagementService = adminBookManagementService;
    }

    @PostMapping
    public ResponseEntity<AdminBookResponse> createBook(@Valid @RequestBody AdminBookUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminBookManagementService.createBook(request));
    }

    @PutMapping("/{bookId}")
    public ResponseEntity<AdminBookResponse> updateBook(@PathVariable Long bookId,
                                                        @Valid @RequestBody AdminBookUpsertRequest request) {
        return ResponseEntity.ok(adminBookManagementService.updateBook(bookId, request));
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long bookId) {
        adminBookManagementService.softDeleteBook(bookId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{bookId}")
    public ResponseEntity<AdminBookResponse> getBookDetail(@PathVariable Long bookId) {
        return ResponseEntity.ok(adminBookManagementService.getBookDetail(bookId));
    }

    @GetMapping
    public ResponseEntity<AdminBookPageResponse> getBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long authorId,
            @RequestParam(required = false) Boolean includeDeleted
    ) {
        return ResponseEntity.ok(adminBookManagementService.getBooks(page, size, keyword, categoryId, authorId, includeDeleted));
    }

    @GetMapping("/options")
    public ResponseEntity<AdminBookOptionsResponse> getBookOptions() {
        return ResponseEntity.ok(adminBookManagementService.getFormOptions());
    }
    // --- ADMIN BOOK MANAGEMENT END: REST endpoints for admin book CRUD/list/filter ---
}
