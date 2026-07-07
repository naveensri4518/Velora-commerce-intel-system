package com.smartbarcode.repository;

import com.smartbarcode.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    List<Invoice> findByCreatedByIdAndCreatedAtBetween(Long createdById, LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = 'COMPLETED'")
    long countCompletedInvoices();

    @Query("SELECT u.fullName, COALESCE(SUM(i.total), 0) FROM Invoice i JOIN i.createdBy u " +
           "WHERE i.status = 'COMPLETED' AND i.createdAt >= :startDate " +
           "GROUP BY u.fullName")
    List<Object[]> getStaffSalesSince(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = 'COMPLETED' AND i.createdAt >= :startDate")
    BigDecimal sumRevenueSince(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT COALESCE(SUM(i.total), 0) FROM Invoice i WHERE i.status = 'COMPLETED' AND " +
           "i.createdAt >= :startDate AND i.createdAt < :endDate")
    BigDecimal sumRevenueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT i FROM Invoice i WHERE " +
           "(:search IS NULL OR LOWER(i.invoiceNumber) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.customerName) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:startDate IS NULL OR i.createdAt >= :startDate) AND " +
           "(:endDate IS NULL OR i.createdAt <= :endDate)")
    Page<Invoice> filterInvoices(@Param("search") String search,
                                  @Param("startDate") LocalDateTime startDate,
                                  @Param("endDate") LocalDateTime endDate,
                                  Pageable pageable);

    @Query("SELECT DATE(i.createdAt) as date, COALESCE(SUM(i.total), 0) as revenue, COUNT(i) as count " +
           "FROM Invoice i WHERE i.status = 'COMPLETED' AND i.createdAt >= :startDate " +
           "GROUP BY DATE(i.createdAt) ORDER BY DATE(i.createdAt)")
    List<Object[]> getDailySalesReport(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT MONTH(i.createdAt) as month, YEAR(i.createdAt) as year, " +
           "COALESCE(SUM(i.total), 0) as revenue, COUNT(i) as count " +
           "FROM Invoice i WHERE i.status = 'COMPLETED' AND i.createdAt >= :startDate " +
           "GROUP BY YEAR(i.createdAt), MONTH(i.createdAt) ORDER BY YEAR(i.createdAt), MONTH(i.createdAt)")
    List<Object[]> getMonthlySalesReport(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT MAX(i.id) FROM Invoice i")
    Long findMaxId();
}
