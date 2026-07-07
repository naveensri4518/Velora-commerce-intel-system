package com.smartbarcode.config;

import com.smartbarcode.entity.User;
import com.smartbarcode.entity.Product;
import com.smartbarcode.repository.UserRepository;
import com.smartbarcode.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Ensure admin user exists with correct password
        userRepository.findByUsername("admin").ifPresentOrElse(
            admin -> {
                admin.setPassword(passwordEncoder.encode("Admin@123"));
                userRepository.save(admin);
                log.info("Admin password reset to Admin@123");
            },
            () -> {
                User admin = User.builder()
                    .username("admin")
                    .email("admin@smartbarcode.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("System Administrator")
                    .role(User.Role.ROLE_ADMIN)
                    .active(true)
                    .build();
                userRepository.save(admin);
                log.info("Admin user created with password Admin@123");
            }
        );

        // Ensure staff1 user exists with correct password
        userRepository.findByUsername("staff1").ifPresentOrElse(
            staff -> {
                staff.setPassword(passwordEncoder.encode("Staff@123"));
                userRepository.save(staff);
                log.info("Staff1 password reset to Staff@123");
            },
            () -> {
                User staff = User.builder()
                    .username("staff1")
                    .email("staff1@smartbarcode.com")
                    .password(passwordEncoder.encode("Staff@123"))
                    .fullName("John Cashier")
                    .role(User.Role.ROLE_STAFF)
                    .active(true)
                    .build();
                userRepository.save(staff);
                log.info("Staff1 user created with password Staff@123");
            }
        );

        // Set realistic GST values for existing products
        List<Product> allProducts = productRepository.findAll();
        boolean productsUpdated = false;
        for (Product p : allProducts) {
            if (p.getTaxRate() == null || p.getTaxRate().compareTo(new BigDecimal("18.00")) == 0) {
                String cat = p.getCategory() != null ? p.getCategory().getName().toLowerCase() : "";
                String name = p.getName().toLowerCase();
                
                if (cat.contains("dairy") || name.contains("milk") || name.contains("curd") || name.contains("paneer")) {
                    p.setTaxRate(new BigDecimal("5.00")); // Dairy is usually 5%
                } else if (cat.contains("snack") || name.contains("chips") || name.contains("biscuit") || name.contains("namkeen")) {
                    p.setTaxRate(new BigDecimal("12.00")); // Snacks 12%
                } else if (name.contains("shake") || name.contains("energy") || name.contains("protein")) {
                    p.setTaxRate(new BigDecimal("18.00")); // Shakes/Supplements 18%
                } else if (cat.contains("electronics") || name.contains("trimmer") || name.contains("battery")) {
                    p.setTaxRate(new BigDecimal("28.00")); // Electronics 28%
                } else if (cat.contains("grocery") || name.contains("rice") || name.contains("wheat") || name.contains("dal")) {
                    p.setTaxRate(new BigDecimal("0.00")); // Essentials 0%
                } else {
                    p.setTaxRate(new BigDecimal("18.00")); // Default 18%
                }
                productsUpdated = true;
            }
        }
        if (productsUpdated) {
            productRepository.saveAll(allProducts);
            log.info("Updated realistic GST tax rates for existing products");
        }

        log.info("SmartBarcode data initialization complete.");
        log.info("Login: admin / Admin@123  |  staff1 / Staff@123");
    }
}
