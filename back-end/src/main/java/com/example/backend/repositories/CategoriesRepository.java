package com.example.backend.repositories;

import com.example.backend.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CategoriesRepository extends JpaRepository<Category, Long> {

    @Query("""
    SELECT c FROM Category c WHERE c.isDeleted = false\s
   \s""")
    public List<Category> getAllCategories();
}
