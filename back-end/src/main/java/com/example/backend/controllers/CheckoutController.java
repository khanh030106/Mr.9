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

    @GetMapping("/profile")
    public ResponseEntity<CheckoutProfileResponse> getCheckoutProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(checkoutProfileService.getProfile(userDetails.getUsername()));
    }

    @PutMapping("/profile")
    public ResponseEntity<CheckoutProfileResponse> saveCheckoutProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CheckoutProfileUpsertRequest request
    ) {
        return ResponseEntity.ok(checkoutProfileService.saveProfile(userDetails.getUsername(), request));
    }

    @PostMapping("/place-order")
    public ResponseEntity<PlaceOrderResponse> placeOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PlaceOrderRequest request
    ) {
        return ResponseEntity.ok(orderCheckoutService.placeOrder(userDetails.getUsername(), request));
    }

}

