package com.smartbarcode.repository;

import com.smartbarcode.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcodeAndActiveTrue(String barcode);

    boolean existsByBarcode(String barcode);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.barcode) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchProducts(@Param("search") String search, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(p.barcode) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:brand IS NULL OR LOWER(p.brand) LIKE LOWER(CONCAT('%', :brand, '%')))")
    Page<Product> filterProducts(@Param("search") String search,
                                  @Param("categoryId") Long categoryId,
                                  @Param("brand") String brand,
                                  Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.currentStock <= p.minStockLevel")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.currentStock = 0")
    List<Product> findOutOfStockProducts();

    @Query("SELECT p FROM Product p WHERE p.active = true AND p.expiryDate IS NOT NULL AND p.expiryDate <= :date")
    List<Product> findExpiringProducts(@Param("date") LocalDate date);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true")
    long countActiveProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.currentStock <= p.minStockLevel")
    long countLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.active = true AND p.currentStock = 0")
    long countOutOfStockProducts();

    @Query("SELECT COALESCE(SUM(p.purchasePrice * p.currentStock), 0) FROM Product p WHERE p.active = true")
    BigDecimal calculateTotalInventoryValue();

    @Query("SELECT COALESCE(SUM(p.currentStock), 0) FROM Product p WHERE p.active = true")
    long calculateTotalStock();

    Page<Product> findByActiveTrue(Pageable pageable);

    @Query("SELECT p.name FROM Product p WHERE p.active = true")
    List<String> findAllActiveProductNames();
}
