package com.example.backend.utils;

import com.example.backend.entities.Role;
import com.example.backend.entities.User;
import com.example.backend.entities.Userrole;
import com.example.backend.entities.UserroleId;
import com.example.backend.enums.AuthProvider;
import com.example.backend.repositories.RoleRepository;
import com.example.backend.repositories.UserRepository;
import com.example.backend.repositories.UserRoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminUserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserSeeder(UserRepository userRepository,
                           RoleRepository roleRepository,
                           UserRoleRepository userRoleRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
//        String adminEmail = "admin@example.com";
//        String adminRoleName = "ROLE_ADMIN";
//
//        // 1. Kiểm tra xem role ADMIN đã tồn tại chưa, nếu chưa thì tạo mới
//        Role adminRole = roleRepository.findByRoleName(adminRoleName)
//                .orElseGet(() -> {
//                    Role newRole = new Role();
//                    newRole.setRoleName(adminRoleName);
//                    return roleRepository.save(newRole);
//                });
//
//        // 2. Kiểm tra xem user admin đã tồn tại chưa
//        if (!userRepository.existsByEmailIgnoreCase(adminEmail)) {
//            User adminUser = new User();
//            adminUser.setFullName("Super Admin");
//            adminUser.setEmail(adminEmail);
//            adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
//            adminUser.setProvider(AuthProvider.LOCAL);
//            adminUser.setIsActive(true);
//            adminUser.setIsDeleted(false);
//
//            // Lưu user vào DB
//            adminUser = userRepository.save(adminUser);
//
//            // 3. Gán role ADMIN cho user này
//            UserroleId userroleId = new UserroleId();
//            userroleId.setUserid(adminUser.getId());
//            userroleId.setRoleid(adminRole.getId());
//
//            Userrole userrole = new Userrole();
//            userrole.setId(userroleId);
//            userrole.setUserID(adminUser);
//            userrole.setRoleID(adminRole);
//
//            userRoleRepository.save(userrole);
//
//            System.out.println(" Đã tạo tài khoản Admin thành công: " + adminEmail + " | Mật khẩu: admin123");
//        } else {
//            System.out.println("⚡ Tài khoản Admin (" + adminEmail + ") đã tồn tại trong hệ thống.");
//        }
    }
}
