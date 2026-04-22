package com.example.backend.services;
import com.example.backend.entities.User;
import com.example.backend.entities.Userrole;
import com.example.backend.repositories.UserRepository;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailService implements UserDetailsService {

    private final UserRepository userRepository;
    public CustomUserDetailService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(@NonNull String email){
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException("User not found with email:"));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .disabled(!Boolean.TRUE.equals(user.getIsActive()))
                .authorities(
                        user.getUserRoles().stream()
                                .map(Userrole::getRoleID)
                                .map(roleID -> new SimpleGrantedAuthority(roleID.getRoleName()))
                                .toList()
                )
                .build();
    }
}
