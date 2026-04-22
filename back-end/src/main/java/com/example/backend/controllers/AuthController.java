package com.example.backend.controllers;

import com.example.backend.dto.requests.RegisterRequest;
import com.example.backend.exceptions.ExistEmailException;
import com.example.backend.exceptions.TokenExpiredException;
import com.example.backend.exceptions.TokenInvalidException;
import com.example.backend.exceptions.TokenUsedException;
import com.example.backend.services.AuthService;
import com.example.backend.services.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Arrays;
import java.util.Map;

@Controller
@RequestMapping("/api/auth")
public class AuthController {
    private final JwtService jwtService;
    private final AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpMs;

    public AuthController(JwtService jwtService,
                          AuthService authService
    ) {
        this.jwtService = jwtService;
        this.authService = authService;
    }

    @Autowired
    private AuthenticationManager  authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request,
                                   HttpServletResponse response
                                   ){
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.get("email"),
                            request.get("password")
                    )
            );
        } catch (DisabledException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("status", HttpStatus.FORBIDDEN.value(), "message", "Your account is not active."));
        } catch (BadCredentialsException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", HttpStatus.UNAUTHORIZED.value(), "message", "Invalid email or password."));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", HttpStatus.UNAUTHORIZED.value(), "message", "Authentication failed."));
        }

        String accessToken = jwtService.generateAccessToken(request.get("email"));
        String refreshToken = jwtService.generateRefreshToken(request.get("email"));

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(refreshExpMs / 1000)
                .sameSite("Lax")
                .build();
        response.addHeader("Set-Cookie", refreshCookie.toString());

        return ResponseEntity.ok(Map.of("accessToken", accessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response){
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader("Set-Cookie", deleteCookie.toString());

        return ResponseEntity.ok("Logged out successfully");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request){

        Cookie[] cookies = request.getCookies();

        if (cookies == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", 401, "message", "Refresh cookies not found."));
        }

        String token = Arrays.stream(request.getCookies())
                .filter(cookie -> cookie.getName().equals("refreshToken"))
                .map(Cookie :: getValue)
                .findFirst()
                .orElse(null);

        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", 401, "message", "Refresh token not found."));
        }

        try {
            String email = jwtService.extractEmail(token);
            String accessToken = jwtService.generateAccessToken(email);

            return ResponseEntity.ok(Map.of("accessToken", accessToken));
        }catch (TokenExpiredException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", 401, "message", "Refresh token is invalid."));
        }


    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new LinkedHashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("status", HttpStatus.BAD_REQUEST.value());
            body.put("message", "Invalid data provided.");
            body.put("errors", errors);
            return ResponseEntity.badRequest().body(body);
        }

        try {
            authService.register(request);
        } catch (ExistEmailException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("status", HttpStatus.CONFLICT.value(), "message", ex.getMessage()));
        } catch (MailException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", HttpStatus.INTERNAL_SERVER_ERROR.value(), "message", "Failed to send mail."));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", HttpStatus.INTERNAL_SERVER_ERROR.value(), "message", "There was an error processing your request."));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Register successfully. Check your email to activate your account!."));
    }

    @GetMapping("/verify-email")
    public void verifyEmail(@RequestParam("token") String token, HttpServletResponse response) throws IOException {
        try {
            authService.verifyEmail(token);
            redirectToFrontend(response, "success", "Verify successfully");
        } catch (TokenExpiredException ex) {
            redirectToFrontend(response, "expired", ex.getMessage());
        } catch (TokenUsedException ex) {
            redirectToFrontend(response, "used", ex.getMessage());
        } catch (TokenInvalidException ex) {
            redirectToFrontend(response, "invalid", ex.getMessage());
        } catch (Exception ex) {
            redirectToFrontend(response, "error", "An unexpected error occurred");
        }
    }

    private void redirectToFrontend(HttpServletResponse response, String status, String message) throws IOException {
        String redirectUrl = frontendUrl + "/verify-email?status="
                + URLEncoder.encode(status, StandardCharsets.UTF_8)
                + "&message="
                + URLEncoder.encode(message, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
