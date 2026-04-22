package com.example.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.backend.dto.interfaces.BookInfo;
import com.example.backend.dto.interfaces.BookReviewInfo;
import com.example.backend.dto.interfaces.FilterOptionInfo;
import com.example.backend.entities.Book;

public interface BookRepository extends JpaRepository<Book, Long> {

    // --- ADMIN BOOK MANAGEMENT START: helpers for admin CRUD/list APIs ---
    Optional<Book> findTopByOrderByIdDesc();

    @Query("""
                SELECT DISTINCT b
                FROM Book b
                LEFT JOIN b.bookCategories bc
                LEFT JOIN bc.categoryID c
                LEFT JOIN b.bookAuthors ba
                LEFT JOIN ba.authorID a
                WHERE (:keyword IS NULL OR LOWER(CAST(b.title AS string)) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%')))
                  AND (:categoryId IS NULL OR c.id = :categoryId)
                  AND (:authorId IS NULL OR a.id = :authorId)
                  AND (COALESCE(:includeDeleted, false) = true OR COALESCE(b.isDeleted, false) = false)
            """)
    Page<Book> findAdminBooks(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("authorId") Long authorId,
            @Param("includeDeleted") Boolean includeDeleted,
            Pageable pageable);
    // --- ADMIN BOOK MANAGEMENT END: helpers for admin CRUD/list APIs ---

    @Query("""
                    SELECT
                        b.id AS id,
                        b.title AS title,
                        b.price AS price,
                        bi.imageUrl AS imageUrl,
                        COALESCE(i.quantity - i.reserved, 0) AS quantity,
                        a.authorName AS authorName,
                        COALESCE(p.discountPercent, 0) AS discountPercent
                    FROM Book b
                    LEFT JOIN b.bookImages bi ON bi.isMain = true
                    LEFT JOIN b.bookAuthors ba
                    LEFT JOIN ba.authorID a
                    LEFT JOIN b.promotionBooks bp
                    LEFT JOIN bp.promotionID p
                    LEFT JOIN b.inventory i ON i.bookID = b
                    WHERE b.isDeleted = false AND b.isActive = true
                    ORDER BY b.soldCount DESC
            """)
    Page<BookInfo> findTop10SoldBooks(Pageable pageable);

    @Query("""
                    SELECT
                        b.id AS id,
                        b.title AS title,
                        b.price AS price,
                        bi.imageUrl AS imageUrl,
                        COALESCE(i.quantity - i.reserved, 0) AS quantity,
                        a.authorName AS authorName,
                        COALESCE(p.discountPercent, 0) AS discountPercent
                    FROM Book b
                    LEFT JOIN b.bookImages bi ON bi.isMain = true
                    LEFT JOIN b.bookAuthors ba
                    LEFT JOIN ba.authorID a
                    LEFT JOIN b.promotionBooks bp
                    LEFT JOIN bp.promotionID p
                        on p.startDate <= CURRENT_TIMESTAMP AND p.endDate >= CURRENT_TIMESTAMP
                    LEFT JOIN b.inventory i ON i.bookID = b
                    WHERE b.isDeleted = false AND b.isActive = true AND p.discountPercent > 0
            """)
    Page<BookInfo> findTop10PromotionBooks(Pageable pageable);

    @Query("""
                    SELECT
                        b.id AS id,
                        b.title AS title,
                        b.price AS price,
                        bi.imageUrl AS imageUrl,
                        COALESCE(i.quantity - i.reserved, 0) AS quantity,
                        a.authorName AS authorName,
                        COALESCE(p.discountPercent, 0) AS discountPercent
                    FROM Book b
                    LEFT JOIN b.bookImages bi ON bi.isMain = true
                    LEFT JOIN b.bookAuthors ba
                    LEFT JOIN ba.authorID a
                    LEFT JOIN b.promotionBooks bp
                    LEFT JOIN bp.promotionID p
                    LEFT JOIN b.inventory i ON i.bookID = b
                    WHERE b.isDeleted = false AND b.isActive = true
                    ORDER BY b.createdAt DESC
            """)
    Page<BookInfo> findAllBooksActive(Pageable pageable);

    // --- ALL BOOKS FILTER REFACTOR START: support combined filters
    // (price/category/author) ---
    @Query("""
                SELECT
                    b.id AS id,
                    b.title AS title,
                    b.price AS price,
                    bi.imageUrl AS imageUrl,
                    COALESCE(i.quantity - i.reserved, 0) AS quantity,
                    COALESCE(MIN(a.authorName), 'Unknown author') AS authorName,
                    COALESCE(MAX(p.discountPercent), 0) AS discountPercent
                FROM Book b
                LEFT JOIN b.bookImages bi ON bi.isMain = true
                LEFT JOIN b.bookAuthors ba
                LEFT JOIN ba.authorID a
                LEFT JOIN b.promotionBooks bp
                LEFT JOIN bp.promotionID p
                    ON p.startDate <= CURRENT_TIMESTAMP AND p.endDate >= CURRENT_TIMESTAMP
                LEFT JOIN b.inventory i ON i.bookID = b
                WHERE b.isDeleted = false
                  AND b.isActive = true
                  AND (:categoryId IS NULL OR EXISTS (
                        SELECT 1 FROM Bookcategory bc
                        WHERE bc.bookID = b AND bc.categoryID.id = :categoryId
                  ))
                  AND (:authorId IS NULL OR EXISTS (
                        SELECT 1 FROM Bookauthor baf
                        WHERE baf.bookID = b AND baf.authorID.id = :authorId
                  ))
                  AND (:minPrice IS NULL OR b.price >= :minPrice)
                  AND (:maxPrice IS NULL OR b.price <= :maxPrice)
                GROUP BY b.id, b.title, b.price, bi.imageUrl, i.quantity, i.reserved
                ORDER BY b.createdAt DESC
            """)
    Page<BookInfo> findAllBooksActiveFiltered(
            @Param("categoryId") Long categoryId,
            @Param("authorId") Long authorId,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    @Query("""
                SELECT DISTINCT
                    a.id AS id,
                    a.authorName AS name
                FROM Bookauthor ba
                JOIN ba.bookID b
                JOIN ba.authorID a
                WHERE b.isDeleted = false
                  AND b.isActive = true
                ORDER BY a.authorName ASC
            """)
    List<FilterOptionInfo> findAllActiveAuthors();
    // --- ALL BOOKS FILTER REFACTOR END: support combined filters
    // (price/category/author) ---

    @Query("""
                SELECT
                        b.id AS id,
                        b.title AS title,
                        b.price AS price,
                        b.soldCount AS soldCount,
                        b.description AS description,
                        bi.imageUrl AS imageUrl,
                        COALESCE(i.quantity - i.reserved, 0) AS quantity,
                        a.authorName AS authorName,
                        pub.publisherName as publisherName,
                        COALESCE(p.discountPercent, 0) AS discountPercent
                    FROM Book b
                    LEFT JOIN b.bookImages bi ON bi.isMain = true
                    LEFT JOIN b.bookAuthors ba
                    LEFT JOIN ba.authorID a
                    LEFT JOIN b.promotionBooks bp
                    LEFT JOIN bp.promotionID p
                    LEFT JOIN b.inventory i ON i.bookID = b
                    LEFT JOIN b.publisherID pub  ON pub.id = b.publisherID.id
                    WHERE b.id = :id AND b.isDeleted = false AND b.isActive = true
            """)
    Optional<BookInfo> findBookById(@Param("id") Long id);

    @Query("""
                SELECT
                        b.id AS id,
                        b.title AS title,
                        b.price AS price,
                        bi.imageUrl AS imageUrl,
                        COALESCE(i.quantity - i.reserved, 0) AS quantity,
                        a.authorName AS authorName,
                        COALESCE(p.discountPercent, 0) AS discountPercent
                    FROM Book b
                    LEFT JOIN b.bookImages bi ON bi.isMain = true
                    LEFT JOIN b.bookAuthors ba
                    LEFT JOIN ba.authorID a
                    LEFT JOIN b.promotionBooks bp
                    LEFT JOIN bp.promotionID p
                    LEFT JOIN b.inventory i ON i.bookID = b
                    LEFT JOIN b.bookCategories bc
                    WHERE bc.categoryID.id IN (
                        SELECT bc2.categoryID.id FROM Book b2
                        LEFT JOIN b2.bookCategories bc2
                        WHERE b2.id = :id
                    )
                    AND b.id != :id
                    AND b.isDeleted = false
                    AND b.isActive = true
                    ORDER BY b.soldCount DESC
            """)
    List<BookInfo> findRelateBook(@Param("id") Long id, Pageable pageable);

    // --- SEARCH REFACTOR START: quick product suggestions for header autocomplete
    // ---
    @Query("""
                SELECT
                    b.id AS id,
                    b.title AS title,
                    b.price AS price,
                    bi.imageUrl AS imageUrl,
                    COALESCE(i.quantity - i.reserved, 0) AS quantity,
                    a.authorName AS authorName,
                    COALESCE(p.discountPercent, 0) AS discountPercent
                FROM Book b
                LEFT JOIN b.bookImages bi ON bi.isMain = true
                LEFT JOIN b.bookAuthors ba
                LEFT JOIN ba.authorID a
                LEFT JOIN b.promotionBooks bp
                LEFT JOIN bp.promotionID p
                LEFT JOIN b.inventory i ON i.bookID = b
                WHERE b.isDeleted = false
                  AND b.isActive = true
                  AND (
                        LOWER(CAST(b.title AS string)) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                        OR LOWER(CAST(a.authorName AS string)) LIKE LOWER(CONCAT('%', CAST(:keyword AS string), '%'))
                  )
                ORDER BY b.soldCount DESC, b.createdAt DESC
            """)
    List<BookInfo> findSearchSuggestions(@Param("keyword") String keyword, Pageable pageable);
    // --- SEARCH REFACTOR END: quick product suggestions for header autocomplete
    // ---

    // --- REVIEW REFACTOR START: query reviews for detail page review tab ---
    @Query("""
                SELECT
                    r.id AS reviewId,
                    u.id AS userId,
                    u.fullName AS reviewerName,
                    u.avatar AS reviewerAvatar,
                    r.rating AS rating,
                    r.comment AS comment,
                    r.createdAt AS createdAt
                FROM Review r
                LEFT JOIN r.userID u
                WHERE r.bookID.id = :bookId
                ORDER BY r.createdAt DESC
            """)
    List<BookReviewInfo> findBookReviews(@Param("bookId") Long bookId, Pageable pageable);
    // --- REVIEW REFACTOR END: query reviews for detail page review tab ---

}
