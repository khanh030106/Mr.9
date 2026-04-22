package com.example.backend.services;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.backend.dto.requests.admin.AdminUserCreateRequest;
import com.example.backend.dto.requests.admin.AdminUserUpdateRequest;
import com.example.backend.dto.responseModel.admin.AdminUserOptionsResponse;
import com.example.backend.dto.responseModel.admin.AdminUserPageResponse;
import com.example.backend.dto.responseModel.admin.AdminUserResponse;
import com.example.backend.entities.Role;
import com.example.backend.entities.User;
import com.example.backend.entities.Userrole;
import com.example.backend.entities.UserroleId;
import com.example.backend.enums.AuthProvider;
import com.example.backend.repositories.RoleRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.UserRoleRepository;

@Service
public class AdminUserManagementService {
    // --- ADMIN USER MANAGEMENT START: service layer for admin user CRUD/status APIs ---
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserManagementService(UserRepository userRepository,
                                      RoleRepository roleRepository,
                                      UserRoleRepository userRoleRepository,
                                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AdminUserPageResponse getUsers(int page,
                                          int size,
                                          String keyword,
                                          String roleName,
                                          Boolean isActive,
                                          Boolean isDeleted) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(100, size));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        String normalizedKeyword = normalizeKeyword(keyword);
        String normalizedRoleName = normalizeRoleName(roleName, false);

        Page<User> result = userRepository.findAdminUsers(
                normalizedKeyword,
                normalizedRoleName,
                isActive,
                isDeleted,
                pageable
        );

        return new AdminUserPageResponse(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(),
                result.getSize(),
                result.getTotalPages(),
                result.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserDetail(Long userId) {
        return toResponse(getUserOrThrow(userId));
    }

    @Transactional(readOnly = true)
    public AdminUserOptionsResponse getUserOptions() {
        return new AdminUserOptionsResponse(
                roleRepository.findAllOrderByRoleName().stream()
                        .map(Role::getRoleName)
                        .filter(roleName -> roleName != null && !roleName.isBlank())
                        .map(roleName -> new AdminUserOptionsResponse.OptionItem(roleName, prettyRoleName(roleName)))
                        .toList()
        );
    }

    @Transactional
    public AdminUserResponse createUser(AdminUserCreateRequest request) {
        String normalizedEmail = normalizeRequiredEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        User user = new User();
        user.setFullName(requireNonBlank(request.getFullName(), "Full name is required"));
        user.setEmail(normalizedEmail);
        user.setPhone(trimToNull(request.getPhone()));
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setIsActive(Boolean.TRUE.equals(request.getIsActive()));
        user.setIsDeleted(false);
        user.setCreatedAt(OffsetDateTime.now());
        user.setProvider(AuthProvider.LOCAL);

        User saved = userRepository.save(user);
        assignSingleRole(saved, request.getRoleName());
        return toResponse(saved);
    }

    @Transactional
    public AdminUserResponse updateUser(Long userId, AdminUserUpdateRequest request) {
        User user = getUserOrThrow(userId);

        if (request.getFullName() != null) {
            user.setFullName(requireNonBlank(request.getFullName(), "Full name is required"));
        }
        if (request.getPhone() != null) {
            user.setPhone(trimToNull(request.getPhone()));
        }
        if (request.getGender() != null) {
            user.setGender(trimToNull(request.getGender()));
        }
        if (request.getDateOfBirth() != null) {
            user.setDateofBirth(request.getDateOfBirth());
        }
        if (request.getIsActive() != null) {
            user.setIsActive(request.getIsActive());
        }

        User saved = userRepository.save(user);

        if (request.getRoleName() != null && !request.getRoleName().isBlank()) {
            assignSingleRole(saved, request.getRoleName());
        }

        return toResponse(saved);
    }

    @Transactional
    public AdminUserResponse setUserEnabled(Long userId, boolean enabled) {
        User user = getUserOrThrow(userId);
        user.setIsActive(enabled);
        userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse softDeleteUser(Long userId) {
        User user = getUserOrThrow(userId);
        user.setIsDeleted(true);
        user.setIsActive(false);
        userRepository.save(user);
        return toResponse(user);
    }

    @Transactional
    public AdminUserResponse restoreUser(Long userId) {
        User user = getUserOrThrow(userId);
        user.setIsDeleted(false);
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            user.setIsActive(true);
        }
        userRepository.save(user);
        return toResponse(user);
    }

    private void assignSingleRole(User user, String roleName) {
        String normalizedRoleName = normalizeRoleName(roleName, true);
        Role role = roleRepository.findByRoleName(normalizedRoleName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role not found"));

        userRoleRepository.deleteByUserID_Id(user.getId());

        Userrole mapping = new Userrole();
        UserroleId mappingId = new UserroleId();
        mappingId.setUserid(user.getId());
        mappingId.setRoleid(role.getId());
        mapping.setId(mappingId);
        mapping.setUserID(user);
        mapping.setRoleID(role);
        userRoleRepository.save(mapping);
    }

    private AdminUserResponse toResponse(User user) {
        User hydrated = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Set<String> roles = new LinkedHashSet<>(hydrated.getUserRoles().stream()
                .map(Userrole::getRoleID)
                .filter(role -> role != null && role.getRoleName() != null)
                .map(Role::getRoleName)
                .sorted(String::compareToIgnoreCase)
                .toList());

        return new AdminUserResponse(
                hydrated.getId(),
                hydrated.getFullName(),
                hydrated.getEmail(),
                hydrated.getPhone(),
                hydrated.getGender(),
                hydrated.getDateofBirth(),
                hydrated.getAvatar(),
                Boolean.TRUE.equals(hydrated.getIsActive()),
                Boolean.TRUE.equals(hydrated.getIsDeleted()),
                hydrated.getCreatedAt(),
                List.copyOf(roles)
        );
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String normalizeRoleName(String roleName, boolean required) {
        if (roleName == null || roleName.isBlank()) {
            if (required) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role is required");
            }
            return null;
        }

        String normalized = roleName.trim().toUpperCase(Locale.ROOT);
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        return normalized;
    }

    private String prettyRoleName(String roleName) {
        String normalized = roleName == null ? "" : roleName.trim();
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }
        return normalized.toUpperCase(Locale.ROOT);
    }

    private String normalizeRequiredEmail(String email) {
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        return normalized;
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }
        String trimmed = keyword.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
    // --- ADMIN USER MANAGEMENT END: service layer for admin user CRUD/status APIs ---
}
