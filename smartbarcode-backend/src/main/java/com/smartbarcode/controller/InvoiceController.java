package com.smartbarcode.controller;

import com.smartbarcode.dto.BillingRequest;
import com.smartbarcode.entity.Invoice;
import com.smartbarcode.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final BillingService billingService;

    @PostMapping("/generate")
    public ResponseEntity<Invoice> generate(@Valid @RequestBody BillingRequest request, Authentication auth) {
        return ResponseEntity.ok(billingService.generateInvoice(request, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<Page<Invoice>> getAll(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(billingService.getAll(search, startDate, endDate,
            PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getById(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getById(id));
    }

    @PostMapping("/{id}/refund")
    public ResponseEntity<Invoice> refundInvoice(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(billingService.refundInvoice(id, auth.getName()));
    }

    @GetMapping("/shift-summary")
    public ResponseEntity<Map<String, Object>> getShiftSummary(Authentication auth) {
        return ResponseEntity.ok(billingService.getShiftSummary(auth.getName()));
    }
}
