package com.example.backend.services;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.requests.admin.AdminCategoryUpsertRequest;
import com.example.backend.dto.responseModel.admin.AdminCategoryOptionsResponse;
import com.example.backend.dto.responseModel.admin.AdminCategoryPageResponse;
import com.example.backend.dto.responseModel.admin.AdminCategoryResponse;
import com.example.backend.entities.Category;
import com.example.backend.repositories.CategoriesRepository;

@Service
public class AdminCategoryManagementService {
    // --- ADMIN CATEGORY MANAGEMENT START: service layer for admin category CRUD/list APIs ---
    private final CategoriesRepository categoriesRepository;

    public AdminCategoryManagementService(CategoriesRepository categoriesRepository) {
        this.categoriesRepository = categoriesRepository;
    }

    @Transactional
    public AdminCategoryResponse createCategory(AdminCategoryUpsertRequest request) {
        Category category = new Category();
        applyCommonFields(category, request, null);
        if (category.getIsDeleted() == null) {
            category.setIsDeleted(false);
        }
        Category saved = categoriesRepository.saveAndFlush(category);
        return toResponse(saved);
    }

    @Transactional
    public AdminCategoryResponse updateCategory(Long categoryId, AdminCategoryUpsertRequest request) {
        Category category = getCategoryOrThrow(categoryId);
        applyCommonFields(category, request, categoryId);
        Category saved = categoriesRepository.saveAndFlush(category);
        return toResponse(saved);
    }

    @Transactional
    public void deleteCategory(Long categoryId) {
        Category category = getCategoryOrThrow(categoryId);
        if (Boolean.TRUE.equals(category.getIsDeleted())) {
            return;
        }

        long totalBooks = categoriesRepository.countNonDeletedBooksByCategoryId(categoryId);
        if (totalBooks > 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete category while it still has books"
            );
        }

        category.setIsDeleted(true);
        categoriesRepository.saveAndFlush(category);
    }

    @Transactional(readOnly = true)
    public AdminCategoryResponse getCategoryDetail(Long categoryId) {
        return toResponse(getCategoryOrThrow(categoryId));
    }

    @Transactional(readOnly = true)
    public AdminCategoryPageResponse getCategories(int page, int size, String keyword, Boolean includeDeleted) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(100, size));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "categoryName"));

        String normalizedKeyword = normalizeKeyword(keyword);
        Page<Category> result = categoriesRepository.findAdminCategories(normalizedKeyword, includeDeleted, pageable);

        return new AdminCategoryPageResponse(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalPages(),
                result.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public AdminCategoryOptionsResponse getCategoryOptions() {
        return new AdminCategoryOptionsResponse(
                categoriesRepository.findAllActiveOrderByName().stream()
                        .map(category -> new AdminCategoryOptionsResponse.OptionItem(
                                category.getId(),
                                category.getCategoryName()
                        ))
                        .toList()
        );
    }

    private Category getCategoryOrThrow(Long categoryId) {
        return categoriesRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    private void applyCommonFields(Category category, AdminCategoryUpsertRequest request, Long selfId) {
        String categoryName = request.getCategoryName() == null ? "" : request.getCategoryName().trim();
        if (categoryName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category name is required");
        }
        categoriesRepository.findByCategoryNameIgnoreCaseAndIsDeletedFalse(categoryName)
                .ifPresent(existing -> {
                    if (selfId == null || !existing.getId().equals(selfId)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
                    }
                });
        category.setCategoryName(categoryName);

        if (request.getParentId() == null) {
            category.setParentID(null);
            return;
        }

        if (selfId != null && selfId.equals(request.getParentId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category cannot be its own parent");
        }

        Category parent = categoriesRepository.findByIdAndIsDeletedFalse(request.getParentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent category not found"));

        if (wouldCreateParentCycle(selfId, parent)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent category creates a cycle");
        }

        category.setParentID(parent);
    }

    private boolean wouldCreateParentCycle(Long selfId, Category parent) {
        if (selfId == null || parent == null) {
            return false;
        }

        Category cursor = parent;
        while (cursor != null) {
            if (selfId.equals(cursor.getId())) {
                return true;
            }
            cursor = cursor.getParentID();
        }
        return false;
    }

    private AdminCategoryResponse toResponse(Category category) {
        long totalBooks = categoriesRepository.countNonDeletedBooksByCategoryId(category.getId());
        Category parent = category.getParentID();

        return new AdminCategoryResponse(
                category.getId(),
                category.getCategoryName(),
                parent != null ? parent.getId() : null,
                parent != null ? parent.getCategoryName() : null,
                Boolean.TRUE.equals(category.getIsDeleted()),
                totalBooks
        );
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
    // --- ADMIN CATEGORY MANAGEMENT END: service layer for admin category CRUD/list APIs ---
}
