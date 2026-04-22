package com.example.backend.controllers;

import com.example.backend.dto.requests.CheckoutProfileUpsertRequest;
import com.example.backend.dto.requests.PlaceOrderRequest;
import com.example.backend.dto.responseModel.CheckoutProfileResponse;
import com.example.backend.dto.responseModel.PlaceOrderResponse;
import com.example.backend.services.CheckoutProfileService;
import com.example.backend.services.OrderCheckoutService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// --- STRIPE REFACTOR START: checkout controller now handles profile + order creation only ---
@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {
    private final CheckoutProfileService checkoutProfileService;
    private final OrderCheckoutService orderCheckoutService;

    public CheckoutController(CheckoutProfileService checkoutProfileService,
                              OrderCheckoutService orderCheckoutService) {
        this.checkoutProfileService = checkoutProfileService;
        this.orderCheckoutService = orderCheckoutService;
    }

    // --- CHECKOUT REFACTOR START: load persisted contact + address + preferred payment for checkout ---
    @GetMapping("/profile")
    public ResponseEntity<CheckoutProfileResponse> getCheckoutProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(checkoutProfileService.getProfile(userDetails.getUsername()));
    }
    // --- CHECKOUT REFACTOR END: load persisted contact + address + preferred payment for checkout ---

    // --- CHECKOUT REFACTOR START: upsert checkout profile and keep default address for current user ---
    @PutMapping("/profile")
    public ResponseEntity<CheckoutProfileResponse> saveCheckoutProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CheckoutProfileUpsertRequest request
    ) {
        return ResponseEntity.ok(checkoutProfileService.saveProfile(userDetails.getUsername(), request));
    }
    // --- CHECKOUT REFACTOR END: upsert checkout profile and keep default address for current user ---

    // --- STRIPE REFACTOR START: create order only, Stripe session is opened by /api/payment/create-checkout-session ---
    @PostMapping("/place-order")
    public ResponseEntity<PlaceOrderResponse> placeOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PlaceOrderRequest request
    ) {
        return ResponseEntity.ok(orderCheckoutService.placeOrder(userDetails.getUsername(), request));
    }
    // --- STRIPE REFACTOR END: create order only, Stripe session is opened by /api/payment/create-checkout-session ---
}
// --- STRIPE REFACTOR END: checkout controller now handles profile + order creation only ---
