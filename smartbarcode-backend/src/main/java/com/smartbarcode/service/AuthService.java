package com.smartbarcode.service;

import com.smartbarcode.dto.LoginRequest;
import com.smartbarcode.dto.LoginResponse;
import com.smartbarcode.entity.User;
import com.smartbarcode.repository.UserRepository;
import com.smartbarcode.security.CustomUserDetailsService;
import com.smartbarcode.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Check if account is locked
        if (user.getLockTime() != null) {
            if (user.getLockTime().isAfter(LocalDateTime.now())) {
                long minutesLeft = java.time.Duration.between(LocalDateTime.now(), user.getLockTime()).toMinutes();
                if (minutesLeft == 0) minutesLeft = 1;
                throw new RuntimeException("Account locked. Try again in " + minutesLeft + " minute(s).");
            } else {
                user.setFailedAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
            }
        }

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (org.springframework.security.core.AuthenticationException e) {
            int attempts = (user.getFailedAttempts() == null ? 0 : user.getFailedAttempts()) + 1;
            user.setFailedAttempts(attempts);
            if (attempts >= 5) {
                user.setLockTime(LocalDateTime.now().plusMinutes(3));
                userRepository.save(user);
                throw new RuntimeException("Account locked for 3 minutes due to 5 failed login attempts.");
            }
            userRepository.save(user);
            throw new RuntimeException("Invalid credentials. Attempt " + attempts + " of 5.");
        }

        // Reset on successful login
        if (user.getFailedAttempts() != null && user.getFailedAttempts() > 0) {
            user.setFailedAttempts(0);
            user.setLockTime(null);
            userRepository.save(user);
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());

        Map<String, Object> claims = Map.of(
            "role", user.getRole().name(),
            "fullName", user.getFullName(),
            "userId", user.getId()
        );

        String accessToken = jwtUtil.generateToken(userDetails, claims);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        auditLogService.log(user.getId(), user.getUsername(), "LOGIN", "USER", user.getId().toString(),
            user.getFullName() + " logged in successfully");

        return LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .username(user.getUsername())
            .fullName(user.getFullName())
            .role(user.getRole().name())
            .userId(user.getId())
            .build();
    }

    public LoginResponse refreshToken(String refreshToken) {
        String username = jwtUtil.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        if (!jwtUtil.validateToken(refreshToken, userDetails)) {
            throw new RuntimeException("Invalid refresh token");
        }

        Map<String, Object> claims = Map.of(
            "role", user.getRole().name(),
            "fullName", user.getFullName(),
            "userId", user.getId()
        );

        String newAccessToken = jwtUtil.generateToken(userDetails, claims);

        return LoginResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .username(user.getUsername())
            .fullName(user.getFullName())
            .role(user.getRole().name())
            .userId(user.getId())
            .build();
    }

    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ROLE_ADMIN) {
            throw new RuntimeException("Admin cannot use forgot password. Please reset it from Settings.");
        }

        String otp = otpService.generateAndStoreOtp(user.getEmail());
        emailService.sendForgotPasswordOtp(user.getEmail(), otp);
        
        auditLogService.log(user.getId(), user.getUsername(), "FORGOT_PASSWORD", "USER", user.getId().toString(),
            "Forgot password requested for " + user.getUsername());
    }

    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == User.Role.ROLE_ADMIN) {
            throw new RuntimeException("Admin cannot use forgot password. Please reset it from Settings.");
        }

        if (!otpService.verifyOtp(user.getEmail(), otp)) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        user.setPendingPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        auditLogService.log(user.getId(), user.getUsername(), "PASSWORD_RESET_REQUESTED", "USER", user.getId().toString(),
            "Password reset requested for " + user.getUsername() + ". Awaiting admin approval.");
    }
}
