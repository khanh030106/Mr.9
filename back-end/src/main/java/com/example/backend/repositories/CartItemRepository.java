package com.example.backend.repositories;

import com.example.backend.entities.Book;
import com.example.backend.entities.Cart;
import com.example.backend.entities.Cartitem;
import com.example.backend.entities.CartitemId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<Cartitem, CartitemId> {

    Optional<Cartitem> findByCartIDAndBookID(Cart cart, Book book);

    void deleteByIdCartidAndIdBookid(Long cartId, Long bookId);

    @Query("""
    select distinct ci
        from Cartitem ci
        join fetch ci.bookID b
        left join fetch b.bookImages bi
        left join fetch b.bookAuthors ba
        left join fetch ba.authorID a
        left join fetch b.promotionBooks pb
        left join fetch pb.promotionID p
        where ci.cartID = :cart
""")
    Page<Cartitem> findByCartID(Cart cart, Pageable pageable);
}
