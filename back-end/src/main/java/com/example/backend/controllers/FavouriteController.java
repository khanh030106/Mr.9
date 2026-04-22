package com.example.backend.controllers;

import com.example.backend.dto.interfaces.BookInfo;
import com.example.backend.services.FavouriteService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/favourites")
public class FavouriteController {
    private final FavouriteService favouriteService;
    public FavouriteController(FavouriteService favouriteService) {
        this.favouriteService = favouriteService;
    }

    @GetMapping
    public ResponseEntity<Page<BookInfo>> getFavourites(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(favouriteService.findFavouriteBooks(userDetails.getUsername()));
    }

    @PostMapping("/add/{bookID}")
    public ResponseEntity<Void> addFavourite(@PathVariable Long bookID, @AuthenticationPrincipal UserDetails userDetails) {
        favouriteService.addFavouriteBooks(userDetails.getUsername(), bookID);
        return ResponseEntity.ok().build();
    }

    // === REFACTOR START: support DELETE endpoint for remove favourite while keeping legacy POST route ===
    @DeleteMapping("/{bookID}")
    public ResponseEntity<Void> removeFavourite(@PathVariable Long bookID, @AuthenticationPrincipal UserDetails userDetails) {
        favouriteService.deleteFavouriteBooks(userDetails.getUsername(), bookID);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/remove/{bookID}")
    public ResponseEntity<Void> removeFavouriteLegacy(@PathVariable Long bookID, @AuthenticationPrincipal UserDetails userDetails) {
        favouriteService.deleteFavouriteBooks(userDetails.getUsername(), bookID);
        return ResponseEntity.noContent().build();
    }
    // === REFACTOR END: support DELETE endpoint for remove favourite while keeping legacy POST route ===
}
