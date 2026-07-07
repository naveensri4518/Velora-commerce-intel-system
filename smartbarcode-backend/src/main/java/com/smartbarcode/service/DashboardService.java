package com.smartbarcode.service;

import com.smartbarcode.dto.DashboardStats;
import com.smartbarcode.entity.User;
import com.smartbarcode.repository.InvoiceRepository;
import com.smartbarcode.repository.ProductRepository;
import com.smartbarcode.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    public DashboardStats getStats() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIDNIGHT);
        LocalDateTime startOfYesterday = startOfDay.minusDays(1);
        LocalDateTime startOfMonth = LocalDateTime.of(LocalDate.now().withDayOfMonth(1), LocalTime.MIDNIGHT);

        List<Object[]> staffSalesRaw = invoiceRepository.getStaffSalesSince(startOfDay);
        Map<String, BigDecimal> staffSalesMap = new HashMap<>();
        for (Object[] row : staffSalesRaw) {
            staffSalesMap.put((String) row[0], (BigDecimal) row[1]);
        }

        return DashboardStats.builder()
            .totalProducts(productRepository.countActiveProducts())
            .totalStock(productRepository.calculateTotalStock())
            .totalInventoryValue(productRepository.calculateTotalInventoryValue())
            .lowStockProducts(productRepository.countLowStockProducts())
            .outOfStockProducts(productRepository.countOutOfStockProducts())
            .todayRevenue(invoiceRepository.sumRevenueSince(startOfDay))
            .yesterdayRevenue(invoiceRepository.sumRevenueBetween(startOfYesterday, startOfDay))
            .monthlyRevenue(invoiceRepository.sumRevenueSince(startOfMonth))
            .totalInvoices(invoiceRepository.countCompletedInvoices())
            .activeStaff(userRepository.countByRoleAndActiveTrue(User.Role.ROLE_STAFF))
            .staffSalesToday(staffSalesMap)
            .build();
    }

    public List<Object[]> getDailySales(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return invoiceRepository.getDailySalesReport(startDate);
    }

    public List<Object[]> getMonthlySales(int months) {
        LocalDateTime startDate = LocalDateTime.now().minusMonths(months);
        return invoiceRepository.getMonthlySalesReport(startDate);
    }
}
