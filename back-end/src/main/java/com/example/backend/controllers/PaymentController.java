package com.example.backend.controllers;

import java.net.URI;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.dto.requests.CreateCheckoutSessionRequest;
import com.example.backend.dto.responseModel.CreateCheckoutSessionResponse;
import com.example.backend.services.VnpayService;

// --- VNPAY REFACTOR START: payment controller exposes VNPay checkout link + return callback endpoint ---
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final VnpayService vnpayService;

    public PaymentController(VnpayService vnpayService) {
        this.vnpayService = vnpayService;
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<CreateCheckoutSessionResponse> createCheckoutSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody CreateCheckoutSessionRequest request
    ) {
        return ResponseEntity.ok(vnpayService.createCheckoutSession(userDetails.getUsername(), request.getOrderId()));
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<Void> handleVnpayReturn(
            @RequestParam Map<String, String> params
    ) {
        String redirectUrl = vnpayService.handleReturn(params);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }
}
// --- VNPAY REFACTOR END: payment controller exposes VNPay checkout link + return callback endpoint ---
