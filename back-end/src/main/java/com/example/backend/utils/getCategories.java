package com.example.backend.utils;

import com.example.backend.dto.responseModel.CategoryResponse;
import com.example.backend.entities.Category;
import com.example.backend.services.CategoriesService;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api")
public class getCategories {
    private final CategoriesService categoriesService;

    public getCategories(CategoriesService categoriesService) {
        this.categoriesService = categoriesService;
    }

    @GetMapping("/get/categories")
    public ResponseEntity<List<CategoryResponse>> getAllCategories(Authentication authentication) {
        List<Category> categories =  categoriesService.getAllCategories();

        List<CategoryResponse> categoriesResponse = categories.stream()
                .map(category -> new CategoryResponse(
                        category.getId(),
                        category.getCategoryName(),
                        category.getParentID() != null ? category.getParentID().getId() : null
                        ))
                .toList();

        return ResponseEntity.ok(categoriesResponse);
    }
}
