package com.smartbarcode.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStats {
    private long totalProducts;
    private long totalStock;
    private BigDecimal totalInventoryValue;
    private long lowStockProducts;
    private long outOfStockProducts;
    private BigDecimal todayRevenue;
    private BigDecimal yesterdayRevenue;
    private BigDecimal monthlyRevenue;
    private long totalInvoices;
    private long activeStaff;
    private Map<String, BigDecimal> staffSalesToday;
}
