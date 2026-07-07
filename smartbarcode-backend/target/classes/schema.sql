-- SmartBarcode Database Schema
-- Run this in MySQL before starting the application

-- CREATE DATABASE IF NOT EXISTS smartbarcode_db;
-- USE smartbarcode_db;

-- Users (Admin + Staff)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('ROLE_ADMIN', 'ROLE_STAFF') NOT NULL DEFAULT 'ROLE_STAFF',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    phone VARCHAR(15),
    failed_attempts INT NOT NULL DEFAULT 0,
    lock_time TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(15),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id BIGINT,
    brand VARCHAR(100),
    supplier_id BIGINT,
    description TEXT,
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 10,
    unit VARCHAR(20) DEFAULT 'pcs',
    expiry_date DATE,
    image_url VARCHAR(500),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(15),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_type ENUM('FLAT', 'PERCENTAGE') DEFAULT 'FLAT',
    discount_value DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_method ENUM('CASH', 'CARD', 'UPI', 'OTHER') DEFAULT 'CASH',
    status ENUM('COMPLETED', 'CANCELLED', 'REFUNDED') DEFAULT 'COMPLETED',
    notes TEXT,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_barcode VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    action ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SALE') NOT NULL,
    quantity_changed INT NOT NULL,
    old_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_id VARCHAR(50),
    notes TEXT,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ===================================================
-- SEED DATA
-- ===================================================

-- Default Admin (password: Admin@123)
INSERT IGNORE INTO users (username, email, password, full_name, role, active)
VALUES ('admin', 'admin@smartbarcode.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8RqGO.Xb9dK04DVshy', 'System Administrator', 'ROLE_ADMIN', TRUE);

-- Default Staff (password: Staff@123)
INSERT IGNORE INTO users (username, email, password, full_name, role, active)
VALUES ('staff1', 'staff1@smartbarcode.com', '$2a$10$8K1p/a0dqbQCGi/uqpRfvON3GyCjLUGK9XO6lEgq5cFjh8mLzaG9C', 'John Cashier', 'ROLE_STAFF', TRUE);

-- Categories
INSERT IGNORE INTO categories (name, description) VALUES
('Beverages', 'Soft drinks, juices, water, energy drinks'),
('Snacks', 'Chips, biscuits, namkeen, chocolates'),
('Dairy', 'Milk, cheese, butter, yogurt'),
('Personal Care', 'Shampoo, soap, toothpaste, skincare'),
('Electronics', 'Batteries, chargers, accessories'),
('Groceries', 'Rice, pulses, oil, spices'),
('Frozen Foods', 'Ice cream, frozen meals, nuggets'),
('Bakery', 'Bread, cakes, cookies');

-- Suppliers
INSERT IGNORE INTO suppliers (name, contact_person, email, phone, address) VALUES
('Metro Wholesale', 'Ramesh Kumar', 'ramesh@metro.com', '9876543210', 'Hyderabad, Telangana'),
('Sun Distributors', 'Priya Singh', 'priya@sun.com', '8765432109', 'Bangalore, Karnataka'),
('Star Supply Co', 'Amit Patel', 'amit@star.com', '7654321098', 'Mumbai, Maharashtra');

-- Sample Products
INSERT IGNORE INTO products (barcode, name, category_id, brand, supplier_id, purchase_price, selling_price, current_stock, min_stock_level, unit) VALUES
('8901030878307', 'Red Bull Energy Drink 250ml', 1, 'Red Bull', 1, 85.00, 120.00, 48, 10, 'can'),
('8901063155749', 'Lays Classic Salted Chips 26g', 2, 'Lays', 1, 10.00, 20.00, 150, 20, 'pcs'),
('8901058818944', 'Amul Full Cream Milk 500ml', 3, 'Amul', 2, 28.00, 32.00, 60, 15, 'pcs'),
('8901063152489', 'Dove Shampoo 180ml', 4, 'Dove', 2, 145.00, 185.00, 35, 10, 'bottle'),
('8906067943060', 'Duracell AA Battery 2pcs', 5, 'Duracell', 3, 80.00, 120.00, 25, 5, 'pack'),
('8901030869626', 'India Gate Basmati Rice 1kg', 6, 'India Gate', 1, 85.00, 110.00, 80, 20, 'kg'),
('8901719120015', 'Kwality Walls Cornetto 65ml', 7, 'Kwality Walls', 3, 35.00, 50.00, 40, 10, 'pcs'),
('8901491506452', 'Britannia Good Day 100g', 2, 'Britannia', 2, 18.00, 30.00, 120, 25, 'pcs'),
('8901030878100', 'Monster Energy Green 500ml', 1, 'Monster', 1, 95.00, 140.00, 8, 10, 'can'),
('8901063152001', 'Tropicana Orange Juice 1L', 1, 'Tropicana', 2, 70.00, 95.00, 3, 10, 'bottle');

-- Default Settings
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
('store_name', 'SmartBarcode Retail', 'Store display name'),
('store_address', '123 Main Street, Hyderabad, Telangana 500001', 'Store address for invoices'),
('store_phone', '+91 98765 43210', 'Store contact number'),
('store_email', 'contact@smartbarcode.com', 'Store email'),
('gst_rate', '18', 'Default GST rate percentage'),
('currency_symbol', '₹', 'Currency symbol'),
('invoice_prefix', 'INV', 'Invoice number prefix'),
('invoice_footer', 'Thank you for shopping with us! Visit again.', 'Invoice footer message'),
('low_stock_alert', 'true', 'Enable low stock alerts'),
('timezone', 'Asia/Kolkata', 'Store timezone');
