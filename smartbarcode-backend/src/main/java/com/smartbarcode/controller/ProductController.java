package com.smartbarcode.controller;

import com.smartbarcode.entity.Product;
import com.smartbarcode.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<Product>> getAll(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) String brand,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(
            productService.getAll(search, categoryId, brand,
                PageRequest.of(page, size, Sort.by("createdAt").descending()))
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<Product> getByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(productService.getByBarcode(barcode));
    }

    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Map<String, Object> data, Authentication auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(productService.create(data, auth.getName(), userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Map<String, Object> data, Authentication auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(productService.update(id, data, auth.getName(), userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id, Authentication auth) {
        Long userId = getUserId(auth);
        productService.delete(id, auth.getName(), userId);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importCsv(@RequestParam("file") MultipartFile file, Authentication auth) {
        Long userId = getUserId(auth);
        return ResponseEntity.ok(productService.importCsv(file, auth.getName(), userId));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStock() {
        return ResponseEntity.ok(productService.getLowStock());
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<Product>> getOutOfStock() {
        return ResponseEntity.ok(productService.getOutOfStock());
    }

    @GetMapping("/expiring")
    public ResponseEntity<List<Product>> getExpiring(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(productService.getExpiring(days));
    }

    private Long getUserId(Authentication auth) {
        try {
            org.springframework.security.core.userdetails.User user =
                (org.springframework.security.core.userdetails.User) auth.getPrincipal();
            return null; // UserDetails doesn't have id directly; service handles it
        } catch (Exception e) {
            return null;
        }
    }
}
