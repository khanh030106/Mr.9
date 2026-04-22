package com.example.backend.services;

import com.example.backend.entities.Category;
import com.example.backend.repositories.CategoriesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoriesService {
    private final CategoriesRepository categoriesRepository;

    public CategoriesService(CategoriesRepository categoriesRepository) {
        this.categoriesRepository = categoriesRepository;
    }

    public List<Category> getAllCategories() {
        return categoriesRepository.getAllCategories();
    }
}
