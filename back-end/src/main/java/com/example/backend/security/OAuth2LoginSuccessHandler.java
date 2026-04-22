package com.example.backend.security;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.example.backend.entities.User;
import com.example.backend.enums.AuthProvider;
import com.example.backend.repositories.UserRepository;
import com.example.backend.services.AuthService;
import com.example.backend.services.JwtService;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpMs;

    @Override
    public void onAuthenticationSuccess(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull Authentication authentication
    ) throws IOException, ServletException {
        OAuth2User oAuth2User =  (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String avatar = oAuth2User.getAttribute("picture");
        AuthProvider provider = AuthProvider.GOOGLE;

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setProvider(provider);
            userRepository.save(user);
        } else {
            authService.processOAuth2Login(email, name, avatar, provider);
        }

        String accessToken = jwtService.generateAccessToken(email);
        String refreshToken = jwtService.generateRefreshToken(email);

        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
            .httpOnly(true)
            .secure(cookieSecure)
            .path("/")
            .maxAge(refreshExpMs / 1000)
            .sameSite("Lax")
            .build();

        response.addHeader("Set-Cookie", refreshTokenCookie.toString());

        String redirectUrl = "http://localhost:5173/api/login/oauth2/callback?token="
                + URLEncoder.encode(accessToken, StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }
}
