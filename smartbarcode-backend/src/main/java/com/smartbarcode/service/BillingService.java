package com.smartbarcode.service;

import com.smartbarcode.dto.BillingRequest;
import com.smartbarcode.entity.*;
import com.smartbarcode.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class BillingService {

    private final InvoiceRepository invoiceRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public Invoice generateInvoice(BillingRequest request, String username) {
        User staff = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate stock and build items
        List<InvoiceItem> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (BillingRequest.CartItem cartItem : request.getItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + cartItem.getProductId()));

            if (product.getCurrentStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Insufficient stock for: " + product.getName() +
                    ". Available: " + product.getCurrentStock());
            }

            BigDecimal itemSubtotal = cartItem.getUnitPrice()
                .multiply(new BigDecimal(cartItem.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            InvoiceItem item = InvoiceItem.builder()
                .product(product)
                .productName(product.getName())
                .productBarcode(product.getBarcode())
                .quantity(cartItem.getQuantity())
                .unitPrice(cartItem.getUnitPrice())
                .subtotal(itemSubtotal)
                .build();
            items.add(item);
        }

        // Calculate discount
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getDiscountValue() != null && request.getDiscountValue().compareTo(BigDecimal.ZERO) > 0) {
            if (request.getDiscountType() == Invoice.DiscountType.PERCENTAGE) {
                discountAmount = subtotal.multiply(request.getDiscountValue()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            } else {
                discountAmount = request.getDiscountValue();
            }
        }

        BigDecimal afterDiscount = subtotal.subtract(discountAmount);
        
        // Calculate item-level tax
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        for (InvoiceItem item : items) {
            BigDecimal itemDiscount = BigDecimal.ZERO;
            if (subtotal.compareTo(BigDecimal.ZERO) > 0 && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
                itemDiscount = item.getSubtotal().divide(subtotal, 4, RoundingMode.HALF_UP).multiply(discountAmount);
            }
            BigDecimal itemNet = item.getSubtotal().subtract(itemDiscount);
            
            BigDecimal itemTaxRate = item.getProduct().getTaxRate() != null ? item.getProduct().getTaxRate() : new BigDecimal("18.00");
            BigDecimal itemTax = itemNet.multiply(itemTaxRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            
            item.setTaxRate(itemTaxRate);
            item.setTaxAmount(itemTax);
            totalTaxAmount = totalTaxAmount.add(itemTax);
        }
        
        BigDecimal total = afterDiscount.add(totalTaxAmount);

        // Generate invoice number
        String invoiceNumber = generateInvoiceNumber();

        Invoice invoice = Invoice.builder()
            .invoiceNumber(invoiceNumber)
            .customerName(request.getCustomerName())
            .customerPhone(request.getCustomerPhone())
            .subtotal(subtotal)
            .discountType(request.getDiscountType())
            .discountValue(request.getDiscountValue())
            .discountAmount(discountAmount)
            .taxRate(null) // Global tax rate is no longer applicable
            .taxAmount(totalTaxAmount)
            .total(total)
            .paymentMethod(request.getPaymentMethod())
            .status(Invoice.InvoiceStatus.COMPLETED)
            .notes(request.getNotes())
            .createdBy(staff)
            .build();

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Save items and reduce stock
        for (int i = 0; i < items.size(); i++) {
            InvoiceItem item = items.get(i);
            item.setInvoice(savedInvoice);
            invoiceItemRepository.save(item);

            // Reduce stock
            Product product = item.getProduct();
            int oldStock = product.getCurrentStock();
            int newStock = oldStock - item.getQuantity();
            product.setCurrentStock(newStock);
            productRepository.save(product);

            // Log inventory change
            InventoryLog invLog = InventoryLog.builder()
                .product(product)
                .action(InventoryLog.InventoryAction.SALE)
                .quantityChanged(-item.getQuantity())
                .oldStock(oldStock)
                .newStock(newStock)
                .referenceId(invoiceNumber)
                .notes("Sale via invoice " + invoiceNumber)
                .userId(staff.getId())
                .build();
            inventoryLogRepository.save(invLog);
        }

        auditLogService.log(staff.getId(), staff.getUsername(), "INVOICE_GENERATED", "INVOICE",
            savedInvoice.getId().toString(), "Invoice " + invoiceNumber + " generated. Total: ₹" + total);

        // Re-fetch to get fully populated invoice with all items
        return invoiceRepository.findById(savedInvoice.getId())
            .orElse(savedInvoice);
    }

    public Page<Invoice> getAll(String search, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return invoiceRepository.filterInvoices(search, startDate, endDate, pageable);
    }

    public Invoice getById(Long id) {
        return invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Invoice not found: " + id));
    }

    @Transactional
    public Invoice refundInvoice(Long invoiceId, String username) {
        User staff = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new RuntimeException("Invoice not found: " + invoiceId));

        if (invoice.getStatus() == Invoice.InvoiceStatus.REFUNDED) {
            throw new RuntimeException("Invoice is already refunded");
        }

        // Add items back to stock
        for (InvoiceItem item : invoice.getItems()) {
            Product product = item.getProduct();
            int oldStock = product.getCurrentStock();
            int newStock = oldStock + item.getQuantity();
            product.setCurrentStock(newStock);
            productRepository.save(product);

            InventoryLog invLog = InventoryLog.builder()
                .product(product)
                .action(InventoryLog.InventoryAction.STOCK_IN)
                .quantityChanged(item.getQuantity())
                .oldStock(oldStock)
                .newStock(newStock)
                .referenceId(invoice.getInvoiceNumber())
                .notes("Refund via invoice " + invoice.getInvoiceNumber())
                .userId(staff.getId())
                .build();
            inventoryLogRepository.save(invLog);
        }

        invoice.setStatus(Invoice.InvoiceStatus.REFUNDED);
        Invoice savedInvoice = invoiceRepository.save(invoice);

        auditLogService.log(staff.getId(), staff.getUsername(), "INVOICE_REFUNDED", "INVOICE",
            savedInvoice.getId().toString(), "Invoice " + invoice.getInvoiceNumber() + " refunded. Total: ₹" + invoice.getTotal());

        return savedInvoice;
    }

    public Map<String, Object> getShiftSummary(String username) {
        User staff = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        List<Invoice> todaysInvoices = invoiceRepository.findByCreatedByIdAndCreatedAtBetween(staff.getId(), startOfDay, endOfDay);
        
        long totalBills = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal cashTotal = BigDecimal.ZERO;
        BigDecimal cardTotal = BigDecimal.ZERO;
        BigDecimal upiTotal = BigDecimal.ZERO;
        BigDecimal otherTotal = BigDecimal.ZERO;

        for (Invoice inv : todaysInvoices) {
            if (inv.getStatus() == Invoice.InvoiceStatus.COMPLETED) {
                totalBills++;
                totalRevenue = totalRevenue.add(inv.getTotal());
                
                switch (inv.getPaymentMethod()) {
                    case CASH: cashTotal = cashTotal.add(inv.getTotal()); break;
                    case CARD: cardTotal = cardTotal.add(inv.getTotal()); break;
                    case UPI: upiTotal = upiTotal.add(inv.getTotal()); break;
                    case OTHER: otherTotal = otherTotal.add(inv.getTotal()); break;
                }
            }
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("date", startOfDay.toLocalDate().toString());
        summary.put("staffName", staff.getFullName());
        summary.put("totalBills", totalBills);
        summary.put("totalRevenue", totalRevenue);
        summary.put("cashTotal", cashTotal);
        summary.put("cardTotal", cardTotal);
        summary.put("upiTotal", upiTotal);
        summary.put("otherTotal", otherTotal);
        
        return summary;
    }

    private String generateInvoiceNumber() {
        Long maxId = invoiceRepository.findMaxId();
        long nextNum = (maxId == null ? 0 : maxId) + 1;
        return String.format("INV-%d-%06d", java.time.Year.now().getValue(), nextNum);
    }
}
