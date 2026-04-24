package com.example.backend.controllers;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.interfaces.BookInfo;
import com.example.backend.dto.interfaces.BookReviewInfo;
import com.example.backend.dto.interfaces.FilterOptionInfo;
import com.example.backend.dto.requests.CreateReviewRequest;
import com.example.backend.services.BookService;

@RestController
@RequestMapping("/api/books")
public class BookController {
    private final BookService bookService;
    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<BookInfo>> searchSuggestions(
            @RequestParam(name = "q", defaultValue = "") String keyword,
            @RequestParam(name = "limit", defaultValue = "5") int limit
    ) {
        return ResponseEntity.ok(bookService.findSearchSuggestions(keyword, limit));
    }
    @GetMapping("/active")
    public ResponseEntity<Page<BookInfo>> getActiveBooks(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "16") int size,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "authorId", required = false) Long authorId,
            @RequestParam(name = "price", required = false) String priceRange
    ) {
        return ResponseEntity.ok(bookService.findAllBooksActiveFiltered(page, size, categoryId, authorId, priceRange));
    }

    @GetMapping("/authors")
    public ResponseEntity<List<FilterOptionInfo>> getActiveAuthors() {
        return ResponseEntity.ok(bookService.findAllActiveAuthors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookInfo> getDetailBook(@PathVariable Long id){
        return bookService.findBookById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<List<BookInfo>> getRelatedBook(@PathVariable Long id){
        return ResponseEntity.ok(bookService.findRelateBook(id));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<BookReviewInfo>> getBookReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "20") int limit
    ) {
        return ResponseEntity.ok(bookService.findBookReviews(id, limit));
    }

    @PostMapping("/{id}/reviews")
    public ResponseEntity<Map<String, Object>> createBookReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateReviewRequest request
    ) {
        if (userDetails == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please login to submit feedback");
        }

        Long createdReviewId = bookService.createBookReview(id, userDetails.getUsername(), request);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("reviewId", createdReviewId);
        body.put("message", "Review created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

}
