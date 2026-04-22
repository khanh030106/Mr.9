package com.example.backend.services;

import com.example.backend.dto.requests.RegisterRequest;
import com.example.backend.entities.*;
import com.example.backend.enums.AuthProvider;
import com.example.backend.exceptions.ExistEmailException;
import com.example.backend.exceptions.TokenExpiredException;
import com.example.backend.exceptions.TokenInvalidException;
import com.example.backend.exceptions.TokenUsedException;
import com.example.backend.repositories.RoleRepository;
import com.example.backend.repositories.TokenRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.UserRoleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final TokenRepository tokenRepository;
    private final EmailService emailService;

    @Value("${app.verify-token-exp-minutes:15}")
    private long verifyTokenExpMinutes;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       RoleRepository roleRepository,
                       UserRoleRepository userRoleRepository,
                       TokenRepository tokenRepository,
                       EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    public void processOAuth2Login(String email,
                                   String fullName,
                                   String avatarUrl,
                                   AuthProvider provider
    ){
        Optional<User> existingUser = userRepository.findByEmail(email);

        if (existingUser.isPresent()) {
            User u =  existingUser.get();
            if (!u.getProvider().equals(provider)) {
                throw new RuntimeException("This email is already registered with another provider.");
            }
        }else {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(fullName);
            newUser.setAvatar(avatarUrl);
            newUser.setIsActive(true);
            newUser.setIsDeleted(false);
            newUser.setCreatedAt(OffsetDateTime.now());
            newUser.setProvider(provider);
            newUser.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));

            userRepository.save(newUser);

            Role userRole =roleRepository.findByRoleName("ROLE_CUSTOMER").orElseThrow(() -> new RuntimeException("Role Customer không tồn tại"));

            Userrole userrole = new Userrole();
            UserroleId id = new UserroleId();

            id.setUserid(newUser.getId());
            id.setRoleid(userRole.getId());

            userrole.setId(id);
            userrole.setUserID(newUser);
            userrole.setRoleID(userRole);

            userRoleRepository.save(userrole);
        }
    }

    public void register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ExistEmailException("This account is already exist.");
        }

        User newUser = new User();
        newUser.setFullName(request.getFullName().trim());
        newUser.setEmail(email);
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setIsActive(false);
        newUser.setIsDeleted(false);
        newUser.setCreatedAt(OffsetDateTime.now());
        newUser.setProvider(AuthProvider.LOCAL);
        userRepository.save(newUser);

        Role userRole = roleRepository.findByRoleName("ROLE_CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Role Customer khong ton tai"));

        Userrole userrole = new Userrole();
        UserroleId roleId = new UserroleId();
        roleId.setUserid(newUser.getId());
        roleId.setRoleid(userRole.getId());
        userrole.setId(roleId);
        userrole.setUserID(newUser);
        userrole.setRoleID(userRole);
        userRoleRepository.save(userrole);

        String tokenValue = UUID.randomUUID().toString();
        Emailverificationtoken token = new Emailverificationtoken();
        token.setUser(newUser);
        token.setToken(tokenValue);
        token.setIsUsed(false);
        token.setCreatedAt(OffsetDateTime.now());
        token.setExpiredAt(OffsetDateTime.now().plusMinutes(verifyTokenExpMinutes));
        tokenRepository.save(token);

        emailService.sendVerificationEmail(email, tokenValue);
    }

    public void verifyEmail(String tokenValue) {
        Emailverificationtoken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new TokenInvalidException("Invalid link"));

        if (Boolean.TRUE.equals(token.getIsUsed())) {
            throw new TokenUsedException("This link has already been used");
        }

        if (token.getExpiredAt().isBefore(OffsetDateTime.now())) {
            throw new TokenExpiredException("This link has expired");
        }

        User user = token.getUser();
        user.setIsActive(true);
        userRepository.save(user);

        token.setIsUsed(true);
        tokenRepository.save(token);

        tokenRepository.markAllUnusedTokensAsUsedByUserId(user.getId());
    }

}
