package com.example.backend.components;
import com.example.backend.services.CustomUserDetailService;
import com.example.backend.services.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final CustomUserDetailService customUserDetailService;

    public JwtFilter(JwtService jwtService, CustomUserDetailService customUserDetailService) {
        this.jwtService = jwtService;
        this.customUserDetailService = customUserDetailService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, java.io.IOException {

        String path = request.getServletPath();

        boolean isPublicAuthEndpoint =
                path.equals("/api/auth/login") ||
                        path.equals("/api/auth/refresh") ||
                        path.equals("/api/auth/logout");

        if (isPublicAuthEndpoint) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")){
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String token = header.substring(7);
            String email = jwtService.extractEmail(token);

            UserDetails userDetails = customUserDetailService.loadUserByUsername(email);

            UsernamePasswordAuthenticationToken auth =  new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(auth);
        }catch (Exception e){
            SecurityContextHolder.clearContext();
            System.out.println("JWT auth failed at path: " + path + " - " + e.getMessage());
            e.printStackTrace();
            System.out.println("JWT error: " + e.getMessage());
        }
        filterChain.doFilter(request, response);
    }
}
