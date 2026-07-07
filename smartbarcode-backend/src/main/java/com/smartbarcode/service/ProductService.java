package com.smartbarcode.service;

import com.smartbarcode.entity.Product;
import com.smartbarcode.repository.CategoryRepository;
import com.smartbarcode.repository.ProductRepository;
import com.smartbarcode.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import org.springframework.web.multipart.MultipartFile;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import com.smartbarcode.entity.Category;
import com.smartbarcode.entity.Supplier;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final AuditLogService auditLogService;

    public Page<Product> getAll(String search, Long categoryId, String brand, Pageable pageable) {
        if (search != null || categoryId != null || brand != null) {
            return productRepository.filterProducts(search, categoryId, brand, pageable);
        }
        return productRepository.findByActiveTrue(pageable);
    }

    public Product getById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Product not found: " + id));
    }

    public Product getByBarcode(String barcode) {
        return productRepository.findByBarcodeAndActiveTrue(barcode)
            .orElseThrow(() -> new RuntimeException("Product not found for barcode: " + barcode));
    }

    @Transactional
    public Product create(Map<String, Object> data, String username, Long userId) {
        String barcode = (String) data.get("barcode");
        if (productRepository.existsByBarcode(barcode)) {
            throw new RuntimeException("Barcode already exists: " + barcode);
        }

        Product product = buildProduct(data, new Product());
        Product saved = productRepository.save(product);
        auditLogService.log(userId, username, "PRODUCT_CREATED", "PRODUCT", saved.getId().toString(),
            "Product created: " + saved.getName());
        return saved;
    }

    @Transactional
    public Product update(Long id, Map<String, Object> data, String username, Long userId) {
        Product existing = getById(id);
        Product updated = buildProduct(data, existing);
        Product saved = productRepository.save(updated);
        auditLogService.log(userId, username, "PRODUCT_UPDATED", "PRODUCT", saved.getId().toString(),
            "Product updated: " + saved.getName());
        return saved;
    }

    @Transactional
    public void delete(Long id, String username, Long userId) {
        Product product = getById(id);
        product.setActive(false);
        productRepository.save(product);
        auditLogService.log(userId, username, "PRODUCT_DELETED", "PRODUCT", id.toString(),
            "Product deleted: " + product.getName());
    }

    @Transactional
    public Map<String, Object> importCsv(MultipartFile file, String username, Long userId) {
        int successCount = 0;
        int skipCount = 0;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader().withIgnoreHeaderCase().withTrim())) {
            
            // Pre-fetch categories and suppliers for mapping
            List<Category> allCategories = categoryRepository.findAll();
            Map<String, Category> categoryMap = new HashMap<>();
            for (Category c : allCategories) {
                categoryMap.put(c.getName().toLowerCase(), c);
            }

            List<Supplier> allSuppliers = supplierRepository.findAll();
            Map<String, Supplier> supplierMap = new HashMap<>();
            for (Supplier s : allSuppliers) {
                supplierMap.put(s.getName().toLowerCase(), s);
            }

            for (CSVRecord record : csvParser) {
                try {
                    String barcode = record.get("Barcode");
                    String name = record.get("Name");
                    String sellingPriceStr = record.get("Selling Price");
                    
                    if (barcode == null || barcode.isEmpty() || name == null || name.isEmpty() || sellingPriceStr == null || sellingPriceStr.isEmpty()) {
                        skipCount++;
                        continue; // Skip invalid rows
                    }

                    if (productRepository.existsByBarcode(barcode)) {
                        skipCount++;
                        continue; // Skip existing barcodes
                    }

                    Product product = new Product();
                    product.setBarcode(barcode);
                    product.setName(name);
                    
                    if (record.isMapped("Brand")) product.setBrand(record.get("Brand"));
                    if (record.isMapped("Description")) product.setDescription(record.get("Description"));
                    if (record.isMapped("Unit")) product.setUnit(record.get("Unit"));
                    
                    try { product.setSellingPrice(new BigDecimal(sellingPriceStr)); } catch (Exception e) {}
                    if (record.isMapped("Purchase Price")) {
                        try { product.setPurchasePrice(new BigDecimal(record.get("Purchase Price"))); } catch (Exception e) {}
                    }
                    if (record.isMapped("Current Stock")) {
                        try { product.setCurrentStock(Integer.parseInt(record.get("Current Stock"))); } catch (Exception e) {}
                    }
                    if (record.isMapped("Min Stock")) {
                        try { product.setMinStockLevel(Integer.parseInt(record.get("Min Stock"))); } catch (Exception e) {}
                    }
                    if (record.isMapped("Expiry Date")) {
                        try { product.setExpiryDate(LocalDate.parse(record.get("Expiry Date"))); } catch (Exception e) {}
                    }
                    if (record.isMapped("Tax Rate")) {
                        try { product.setTaxRate(new BigDecimal(record.get("Tax Rate"))); } catch (Exception e) {}
                    }

                    // Map Category
                    if (record.isMapped("Category") && record.get("Category") != null && !record.get("Category").isEmpty()) {
                        Category category = categoryMap.get(record.get("Category").toLowerCase());
                        if (category != null) {
                            product.setCategory(category);
                        }
                    }
                    
                    // Map Supplier
                    if (record.isMapped("Supplier") && record.get("Supplier") != null && !record.get("Supplier").isEmpty()) {
                        Supplier supplier = supplierMap.get(record.get("Supplier").toLowerCase());
                        if (supplier != null) {
                            product.setSupplier(supplier);
                        }
                    }

                    productRepository.save(product);
                    successCount++;
                } catch (Exception ex) {
                    skipCount++;
                }
            }
            
            auditLogService.log(userId, username, "BULK_IMPORT", "PRODUCT", null,
                "Bulk imported " + successCount + " products");

            Map<String, Object> response = new HashMap<>();
            response.put("successCount", successCount);
            response.put("skipCount", skipCount);
            return response;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }
    }

    public List<Product> getLowStock() {
        return productRepository.findLowStockProducts();
    }

    public List<Product> getOutOfStock() {
        return productRepository.findOutOfStockProducts();
    }

    public List<Product> getExpiring(int daysAhead) {
        return productRepository.findExpiringProducts(LocalDate.now().plusDays(daysAhead));
    }

    private Product buildProduct(Map<String, Object> data, Product product) {
        if (data.containsKey("barcode")) product.setBarcode((String) data.get("barcode"));
        if (data.containsKey("name")) product.setName((String) data.get("name"));
        if (data.containsKey("brand")) product.setBrand((String) data.get("brand"));
        if (data.containsKey("description")) product.setDescription((String) data.get("description"));
        if (data.containsKey("unit")) product.setUnit((String) data.get("unit"));
        if (data.containsKey("imageUrl")) product.setImageUrl((String) data.get("imageUrl"));

        if (data.containsKey("purchasePrice") && data.get("purchasePrice") != null && !data.get("purchasePrice").toString().trim().isEmpty()) {
            product.setPurchasePrice(new java.math.BigDecimal(data.get("purchasePrice").toString()));
        }
        if (data.containsKey("sellingPrice") && data.get("sellingPrice") != null && !data.get("sellingPrice").toString().trim().isEmpty()) {
            product.setSellingPrice(new java.math.BigDecimal(data.get("sellingPrice").toString()));
        }
        if (data.containsKey("taxRate") && data.get("taxRate") != null && !data.get("taxRate").toString().trim().isEmpty()) {
            product.setTaxRate(new java.math.BigDecimal(data.get("taxRate").toString()));
        }
        if (data.containsKey("currentStock") && data.get("currentStock") != null && !data.get("currentStock").toString().trim().isEmpty()) {
            product.setCurrentStock(Integer.parseInt(data.get("currentStock").toString()));
        }
        if (data.containsKey("minStockLevel") && data.get("minStockLevel") != null && !data.get("minStockLevel").toString().trim().isEmpty()) {
            product.setMinStockLevel(Integer.parseInt(data.get("minStockLevel").toString()));
        }
        if (data.containsKey("expiryDate") && data.get("expiryDate") != null && !data.get("expiryDate").toString().trim().isEmpty()) {
            product.setExpiryDate(LocalDate.parse((String) data.get("expiryDate")));
        }
        if (data.containsKey("categoryId") && data.get("categoryId") != null && !data.get("categoryId").toString().trim().isEmpty()) {
            categoryRepository.findById(Long.parseLong(data.get("categoryId").toString()))
                .ifPresent(product::setCategory);
        }
        if (data.containsKey("supplierId") && data.get("supplierId") != null && !data.get("supplierId").toString().trim().isEmpty()) {
            supplierRepository.findById(Long.parseLong(data.get("supplierId").toString()))
                .ifPresent(product::setSupplier);
        }
        return product;
    }
}
