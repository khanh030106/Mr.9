package com.example.backend.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String formEmail;

    @Value("${app.backend-url}")
    private String backendUrl;

    public void sendVerificationEmail(String toEmail, String token) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        String verifyUrl = backendUrl + "/api/auth/verify-email?token=" + encodedToken;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(formEmail);
        message.setTo(toEmail);
        message.setSubject("Verify your KBOOKs's account!");
        message.setText(
                "Hello, Welcome to KBOOKs\n\n" +
                        "Please click this link to active your KBOOKs's account!:\n" +
                        verifyUrl + "\n\n" +
                        "This link is valid for 15 minutes!.\n\n" +
                        "If you wasn't registered, please ignore this email! \n\n"+
                        "Best regards,\n" +
                        "KBOOKs Team"
        );

        mailSender.send(message);
    }
}
