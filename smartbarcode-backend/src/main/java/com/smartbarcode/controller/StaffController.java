package com.smartbarcode.controller;

import com.smartbarcode.dto.CreateUserRequest;
import com.smartbarcode.entity.User;
import com.smartbarcode.repository.UserRepository;
import com.smartbarcode.service.AuditLogService;
import com.smartbarcode.service.EmailService;
import com.smartbarcode.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StaffController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final OtpService otpService;
    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<Page<User>> getAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
            userRepository.findByRole(User.Role.ROLE_STAFF, PageRequest.of(page, size, Sort.by("createdAt").descending()))
        );
    }

    @PostMapping("/send-otp")
    public ResponseEntity<Map<String, String>> sendOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        String otp = otpService.generateAndStoreOtp(email);
        emailService.sendOtpEmail(email, otp);
        return ResponseEntity.ok(Map.of("message", "OTP sent successfully"));
    }

    @PostMapping
    public ResponseEntity<User> create(@Valid @RequestBody CreateUserRequest request) {
        if (request.getOtp() == null || !otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new RuntimeException("Invalid or expired OTP");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .role(User.Role.ROLE_STAFF)
            .active(true)
            .failedAttempts(0)
            .build();

        User saved = userRepository.save(user);
        auditLogService.log(null, "admin", "STAFF_CREATED", "USER", saved.getId().toString(),
            "Staff created: " + saved.getFullName());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable Long id, @RequestBody Map<String, Object> data) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (data.containsKey("fullName")) user.setFullName((String) data.get("fullName"));
        if (data.containsKey("email")) user.setEmail((String) data.get("email"));
        if (data.containsKey("phone")) user.setPhone((String) data.get("phone"));

        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Map<String, String>> deactivate(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(!user.getActive());
        userRepository.save(user);
        String status = user.getActive() ? "activated" : "deactivated";
        return ResponseEntity.ok(Map.of("message", "User " + status + " successfully"));
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable Long id,
                                                              @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(body.get("newPassword")));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PutMapping("/{id}/approve-password-reset")
    public ResponseEntity<Map<String, String>> approvePasswordReset(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getPendingPassword() == null) {
            throw new RuntimeException("No pending password reset for this user");
        }
        
        user.setPassword(user.getPendingPassword());
        user.setPendingPassword(null);
        user.setFailedAttempts(0);
        user.setLockTime(null);
        userRepository.save(user);
        
        auditLogService.log(null, "admin", "PASSWORD_RESET_APPROVED", "USER", id.toString(),
            "Approved password reset for " + user.getFullName());
            
        return ResponseEntity.ok(Map.of("message", "Password reset approved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        try {
            userRepository.delete(user);
            auditLogService.log(null, "admin", "STAFF_DELETED", "USER", id.toString(),
                "Staff deleted: " + user.getFullName());
            return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
        } catch (Exception e) {
            throw new RuntimeException("Cannot delete user with associated records. Please deactivate instead.");
        }
    }
}
