package com.example.backend.controllers;

import com.example.backend.dto.requests.AddCartRequest;
import com.example.backend.dto.requests.UpdateCartQuantityRequest;
import com.example.backend.dto.responseModel.CartItemResponse;
import com.example.backend.services.CartService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<Page<CartItemResponse>> getCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "3") int pageSize
            ) {
        return ResponseEntity.ok(cartService.getCart(userDetails.getUsername(), page, pageSize));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@RequestBody AddCartRequest request,
                                       @AuthenticationPrincipal UserDetails userDetails) {
        cartService.addToCart(userDetails.getUsername(), request);
        return ResponseEntity.ok("Đã thêm vào giỏ hàng");
    }

    @DeleteMapping("/delete/{bookId}")
    public ResponseEntity<Void> removeFromCart(@PathVariable Long bookId,
                                               @AuthenticationPrincipal UserDetails userDetails
                                               ) {
        cartService.removeFromCart(userDetails.getUsername(), bookId);
        return ResponseEntity.noContent().build();
    }

    // --- BEGIN FIX: PATCH quantity — revert: xóa method này + UpdateCartQuantityRequest + CartService.updateCartItemQuantity ---
    @PatchMapping("/item/{bookId}")
    public ResponseEntity<Void> updateCartItemQuantity(
            @PathVariable Long bookId,
            @RequestBody UpdateCartQuantityRequest body,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        cartService.updateCartItemQuantity(userDetails.getUsername(), bookId, body.getQuantity());
        return ResponseEntity.noContent().build();
    }
    // --- END FIX: PATCH quantity ---

}
