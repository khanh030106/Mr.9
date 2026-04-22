package com.example.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.entities.Bookcategory;
import com.example.backend.entities.BookcategoryId;

public interface BookCategoryRepository extends JpaRepository<Bookcategory, BookcategoryId> {
    // --- ADMIN BOOK MANAGEMENT START: replace book-category links on update ---
    @Transactional
    void deleteByBookID_Id(Long bookId);
    // --- ADMIN BOOK MANAGEMENT END: replace book-category links on update ---
}
