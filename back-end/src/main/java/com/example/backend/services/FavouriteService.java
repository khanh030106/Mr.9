package com.example.backend.services;

import com.example.backend.dto.interfaces.BookInfo;
import com.example.backend.entities.Book;
import com.example.backend.entities.User;
import com.example.backend.entities.Wishlist;
import com.example.backend.entities.WishlistId;
import com.example.backend.repositories.BookRepository;
import com.example.backend.repositories.FavouriteRepository;
import com.example.backend.repositories.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FavouriteService {
    private final FavouriteRepository favouriteRepository;
    private final UserRepository userRepository;
    private final BookRepository bookRepository;

    public FavouriteService(
            FavouriteRepository favouriteRepository,
            UserRepository userRepository,
            BookRepository bookRepository
    ) {
        this.favouriteRepository = favouriteRepository;
        this.userRepository = userRepository;
        this.bookRepository = bookRepository;
    }

    public Page<BookInfo> findFavouriteBooks(String email) {
        Pageable page = PageRequest.of(0, 10);
        return favouriteRepository.findFavoriteBooks(email, page);
    }

    public void addFavouriteBooks(String email, Long bookID){
        User user = userRepository.findByEmail(email).orElse(null);
        Book book = bookRepository.findById(bookID).orElse(null);

        if (user != null && book != null) {
            Wishlist wishlist = favouriteRepository.findByUserIDAndBookID(user, book);

            if (wishlist != null) {
                return;
            }

            WishlistId id = new WishlistId();
            id.setUserid(user.getId());
            id.setBookid(book.getId());

            Wishlist newItem = new Wishlist();
            newItem.setId(id);
            newItem.setUserID(user);
            newItem.setBookID(book);
            favouriteRepository.save(newItem);

        }
    }

    public void deleteFavouriteBooks(String email, Long bookID){
        // === REFACTOR START: delete favourite by composite key (userId + bookId) to avoid entity lookup mismatch ===
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        WishlistId wishlistId = new WishlistId();
        wishlistId.setUserid(user.getId());
        wishlistId.setBookid(bookID);

        if (!favouriteRepository.existsById(wishlistId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }

        favouriteRepository.deleteById(wishlistId);
        // === REFACTOR END: delete favourite by composite key (userId + bookId) to avoid entity lookup mismatch ===
    }
}
