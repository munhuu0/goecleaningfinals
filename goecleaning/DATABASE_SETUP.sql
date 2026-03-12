-- GoeCleaning Database Setup Script for Hostinger MySQL
-- Run this script to create the database structure if auto-sync doesn't work

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS goecleaning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE goecleaning;

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  basePrice DECIMAL(10,2),
  pricePerSqm DECIMAL(10,2),
  featured BOOLEAN DEFAULT FALSE,
  `order` INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create portfolios table  
CREATE TABLE IF NOT EXISTS portfolios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  featured BOOLEAN DEFAULT FALSE,
  `order` INT DEFAULT 0,
  images JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customerName VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  location TEXT,
  service VARCHAR(255),
  totalPrice DECIMAL(10,2) DEFAULT 0,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(featured);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_portfolios_featured ON portfolios(featured);
CREATE INDEX IF NOT EXISTS idx_portfolios_category ON portfolios(category);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_createdAt ON contacts(createdAt);

-- Insert sample data (optional)
INSERT IGNORE INTO services (title, description, category, basePrice, pricePerSqm, featured, `order`) VALUES
('Айл гэр', 'Үндсэн ариун цэвэрлэгээ үйлчилгээ', 'residential', 50000.00, 1500.00, TRUE, 1),
('Оффис', 'Оффис байрны цэвэрлэгээ', 'commercial', 75000.00, 2000.00, TRUE, 2),
('Барилгын дараах', 'Барилгын ажил дууссаны дараах цэвэрлэгээ', 'post-construction', 100000.00, 2500.00, TRUE, 3),
('Хивс', 'Хивс угаах, цэвэрлэх үйлчилгээ', 'specialized', 30000.00, 0.00, FALSE, 4),
('Буйдан', 'Буйдан угаах, цэвэрлэх үйлчилгээ', 'specialized', 25000.00, 0.00, FALSE, 5);

-- Sample portfolio items
INSERT IGNORE INTO portfolios (title, description, category, featured, `order`, images) VALUES
('Үндсэн ариун цэвэрлэгээ', 'Ариун цэвэрлэгээний үр дүн', 'residential', TRUE, 1, '[]'),
('Оффис цэвэрлэгээ', 'Оффисыг тав таван цэвэрлэлт', 'commercial', TRUE, 2, '[]'),
('Барилгын дараах цэвэрлэгээ', 'Шинэ барилгын цэвэрлэгээ', 'post-construction', TRUE, 3, '[]');

-- Show table structures
DESCRIBE services;
DESCRIBE portfolios;
DESCRIBE contacts;

-- Success message
SELECT 'Database setup completed successfully!' as message;
