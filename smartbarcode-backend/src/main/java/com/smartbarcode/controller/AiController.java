package com.smartbarcode.controller;

import com.smartbarcode.dto.DashboardStats;
import com.smartbarcode.entity.Category;
import com.smartbarcode.repository.CategoryRepository;
import com.smartbarcode.repository.ProductRepository;
import com.smartbarcode.service.DashboardService;
import com.smartbarcode.service.GeminiAiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final GeminiAiService aiService;
    private final DashboardService dashboardService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @PostMapping("/chat")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        DashboardStats stats = dashboardService.getStats();
        
        String staffSalesStr = "";
        if (stats.getStaffSalesToday() != null && !stats.getStaffSalesToday().isEmpty()) {
            staffSalesStr = stats.getStaffSalesToday().entrySet().stream()
                .map(e -> e.getKey() + ": ₹" + e.getValue())
                .collect(Collectors.joining(", "));
        } else {
            staffSalesStr = "No sales yet today";
        }

        String context = String.format(
            "Current Store Context:\n- Total Products: %d\n- Low Stock: %d\n- Out of Stock: %d\n- Today Revenue: %s\n- Yesterday Revenue: %s\n- Monthly Revenue: %s\n- Active Staff: %d\n- Staff Sales Today: %s\n",
            stats.getTotalProducts(), stats.getLowStockProducts(), stats.getOutOfStockProducts(),
            stats.getTodayRevenue() != null ? stats.getTodayRevenue().toString() : "0",
            stats.getYesterdayRevenue() != null ? stats.getYesterdayRevenue().toString() : "0",
            stats.getMonthlyRevenue() != null ? stats.getMonthlyRevenue().toString() : "0",
            stats.getActiveStaff(),
            staffSalesStr
        );

        String systemPrompt = "You are a highly intelligent and helpful AI assistant for the SmartBarcode POS system Admin Dashboard. " +
            "You help the store owner understand their sales, inventory, and business metrics. " +
            "Use the provided context to answer accurately. Keep responses concise, professional, and directly address the user's question.";

        String response = aiService.generateChatCompletion(systemPrompt, "Data Context:\n" + context + "\n\nUser Question:\n" + message);
        return ResponseEntity.ok(Map.of("response", response));
    }

    @PostMapping("/recommendations")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Map<String, String>> recommendations(@RequestBody Map<String, List<String>> request) {
        List<String> cartItems = request.get("items");
        if (cartItems == null || cartItems.isEmpty()) {
            return ResponseEntity.ok(Map.of("recommendations", ""));
        }

        List<String> activeProducts = productRepository.findAllActiveProductNames();
        String availableProductsStr = String.join(", ", activeProducts);

        String systemPrompt = "You are an AI upsell assistant for a grocery/retail store. " +
            "Given a list of items currently in a customer's cart, suggest exactly 3 complementary products they might also want to buy. " +
            "IMPORTANT: You MUST ONLY suggest products from the 'Available Products' list provided below. Do not suggest any product that is not in the list. " +
            "Return ONLY the names of the 3 products, separated by commas, with no other text.\n\n" +
            "Available Products: " + availableProductsStr;

        String response = aiService.generateChatCompletion(systemPrompt, "Cart Items: " + String.join(", ", cartItems));
        return ResponseEntity.ok(Map.of("recommendations", response.trim()));
    }

    @PostMapping("/categorize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> categorize(@RequestBody Map<String, String> request) {
        String productName = request.get("name");
        
        List<Category> categories = categoryRepository.findAll();
        String catList = categories.stream()
            .map(c -> c.getId() + ":" + c.getName())
            .collect(Collectors.joining(", "));

        String systemPrompt = "You are an AI product categorizer for a retail system. " +
            "Given a product name, you must determine its Category ID from the provided list, and estimate a reasonable selling price (in INR). " +
            "Return the output strictly in this JSON format: {\"categoryId\": ID, \"estimatedPrice\": PRICE}. Do not include markdown formatting or backticks.";

        String userMessage = "Available Categories: " + catList + "\nProduct Name: " + productName;
        String response = aiService.generateChatCompletion(systemPrompt, userMessage);
        
        // Clean up response if the model returned markdown
        if (response.startsWith("```json")) {
            response = response.substring(7);
        }
        if (response.startsWith("```")) {
            response = response.substring(3);
        }
        if (response.endsWith("```")) {
            response = response.substring(0, response.length() - 3);
        }
        
        return ResponseEntity.ok(Map.of("response", response.trim()));
    }
}
