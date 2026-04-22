package com.example.backend.repositories;

import com.example.backend.dto.interfaces.BookInfo;
import com.example.backend.entities.Book;
import com.example.backend.entities.User;
import com.example.backend.entities.Wishlist;
import com.example.backend.entities.WishlistId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FavouriteRepository extends JpaRepository<Wishlist, WishlistId> {

    public Wishlist findByUserIDAndBookID(User user, Book book);

    void deleteByUserIDAndBookID(User userID, Book bookID);

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
        LEFT JOIN b.wishLists w ON w.bookID = b
        WHERE w.userID.email = :email AND b.isDeleted = false AND b.isActive = true
""")
    Page<BookInfo> findFavoriteBooks(String email, Pageable pageable);
}
