package com.example.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.entities.Bookauthor;
import com.example.backend.entities.BookauthorId;

public interface BookAuthorRepository extends JpaRepository<Bookauthor, BookauthorId> {
    // --- ADMIN BOOK MANAGEMENT START: replace book-author links on update ---
    @Transactional
    void deleteByBookID_Id(Long bookId);
    // --- ADMIN BOOK MANAGEMENT END: replace book-author links on update ---
}
