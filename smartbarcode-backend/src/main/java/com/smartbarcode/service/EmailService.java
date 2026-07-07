package com.smartbarcode.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@smartbarcode.com");
            message.setTo(toEmail);
            message.setSubject("SmartBarcode - Staff Registration OTP");
            message.setText("Hello,\n\n" +
                "You have been invited to join the SmartBarcode Staff Portal.\n" +
                "Your One Time Password (OTP) for account verification is: " + otp + "\n\n" +
                "This OTP will expire in 2 minutes.\n\n" +
                "Thank you,\nSmartBarcode Admin");

            mailSender.send(message);
            log.info("OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}. Error: {}", toEmail, e.getMessage());
            // Since we are mocking/testing, we just log it. The OTP is still valid.
            log.info("MOCK EMAIL SENT: OTP for {} is {}", toEmail, otp);
        }
    }

    public void sendForgotPasswordOtp(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("noreply@smartbarcode.com");
            message.setTo(toEmail);
            message.setSubject("SmartBarcode - Password Reset OTP");
            message.setText("Hello,\n\n" +
                "You have requested to reset your password.\n" +
                "Your One Time Password (OTP) is: " + otp + "\n\n" +
                "This OTP will expire in 2 minutes.\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Thank you,\nSmartBarcode Admin");

            mailSender.send(message);
            log.info("Password reset OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send Password reset OTP email to {}. Error: {}", toEmail, e.getMessage());
            // Since we are mocking/testing, we just log it. The OTP is still valid.
            log.info("MOCK EMAIL SENT: Password Reset OTP for {} is {}", toEmail, otp);
        }
    }
}
