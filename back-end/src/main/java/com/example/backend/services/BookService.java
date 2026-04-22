package com.example.backend.services;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.interfaces.BookInfo;
import com.example.backend.dto.interfaces.BookReviewInfo;
import com.example.backend.dto.interfaces.FilterOptionInfo;
import com.example.backend.dto.requests.CreateReviewRequest;
import com.example.backend.entities.Book;
import com.example.backend.entities.Review;
import com.example.backend.entities.User;
import com.example.backend.repositories.BookRepository;
import com.example.backend.repositories.ReviewRepository;
import com.example.backend.repositories.UserRepository;


@Service
public class BookService {
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public BookService(BookRepository bookRepository,
                       UserRepository userRepository,
                       ReviewRepository reviewRepository) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
    }

    public Page<BookInfo> findTop10Books() {
        Pageable page = PageRequest.of(0, 10);
        return bookRepository.findTop10SoldBooks(page);
    }

    public Page<BookInfo> findTop10PromotionBooks() {
        Pageable page = PageRequest.of(0, 10);
        return bookRepository.findTop10PromotionBooks(page);
    }

    public Page<BookInfo> findAllBooksActive() {
        Pageable page = PageRequest.of(0, 10);
        return bookRepository.findAllBooksActive(page);
    }

    // --- ALL BOOKS REFACTOR START: paginated active books for all-books page (4 items x 4 rows) ---
    public Page<BookInfo> findAllBooksActive(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(40, size));
        Pageable pageable = PageRequest.of(safePage, safeSize);
        return bookRepository.findAllBooksActive(pageable);
    }

    public Page<BookInfo> findAllBooksActiveFiltered(
            int page,
            int size,
            Long categoryId,
            Long authorId,
            String priceRange
    ) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(40, size));
        Pageable pageable = PageRequest.of(safePage, safeSize);

        java.math.BigDecimal minPrice = null;
        java.math.BigDecimal maxPrice = null;

        // Reuse fixed price buckets from UI so filters can be used individually or combined.
        if (priceRange != null && !priceRange.isBlank()) {
            switch (priceRange.trim()) {
                case "0-100000" -> {
                    minPrice = java.math.BigDecimal.ZERO;
                    maxPrice = java.math.BigDecimal.valueOf(100000);
                }
                case "100000-200000" -> {
                    minPrice = java.math.BigDecimal.valueOf(100000);
                    maxPrice = java.math.BigDecimal.valueOf(200000);
                }
                case "200000+" -> minPrice = java.math.BigDecimal.valueOf(200000);
                default -> {
                    minPrice = null;
                    maxPrice = null;
                }
            }
        }

        return bookRepository.findAllBooksActiveFiltered(categoryId, authorId, minPrice, maxPrice, pageable);
    }

    public List<FilterOptionInfo> findAllActiveAuthors() {
        return bookRepository.findAllActiveAuthors();
    }
    // --- ALL BOOKS REFACTOR END: paginated active books for all-books page (4 items x 4 rows) ---

    public Optional<BookInfo> findBookById(Long id) {
        return bookRepository.findBookById(id);
    }

    public List<BookInfo> findRelateBook(Long id){
        Pageable pageable = PageRequest.of(0, 8);
        return bookRepository.findRelateBook(id, pageable);
    }

    // --- SEARCH REFACTOR START: service for header autocomplete suggestions ---
    public List<BookInfo> findSearchSuggestions(String keyword, int limit) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }

        int safeLimit = Math.max(1, Math.min(10, limit));
        Pageable pageable = PageRequest.of(0, safeLimit);
        return bookRepository.findSearchSuggestions(keyword.trim(), pageable);
    }
    // --- SEARCH REFACTOR END: service for header autocomplete suggestions ---

    // --- REVIEW REFACTOR START: service for loading reviews in detail tab ---
    public List<BookReviewInfo> findBookReviews(Long id, int limit) {
        int safeLimit = Math.max(1, Math.min(50, limit));
        Pageable pageable = PageRequest.of(0, safeLimit);
        return bookRepository.findBookReviews(id, pageable);
    }

    @Transactional
    public Long createBookReview(Long id, String email, CreateReviewRequest request) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please login to submit feedback");
        }

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid review payload");
        }

        String comment = request.getComment() == null ? "" : request.getComment().trim();
        if (comment.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment is required");
        }

        if (comment.length() > 1000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Comment must be <= 1000 characters");
        }

        Integer rating = request.getRating();
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        }

        Book book = bookRepository.findById(id)
                .filter(found -> !Boolean.TRUE.equals(found.getIsDeleted()) && Boolean.TRUE.equals(found.getIsActive()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));

        User user = userRepository.findByEmail(email.toLowerCase(Locale.ROOT).trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Long reviewId = reviewRepository.findTopByOrderByIdDesc()
                .map(Review::getId)
                .orElse(0L) + 1L;

        Review review = new Review();
        review.setId(reviewId);
        review.setBookID(book);
        review.setUserID(user);
        review.setComment(comment);
        review.setRating(rating);
        review.setCreatedAt(OffsetDateTime.now());

        reviewRepository.save(review);
        return reviewId;
    }
    // --- REVIEW REFACTOR END: service for loading reviews in detail tab ---

}
