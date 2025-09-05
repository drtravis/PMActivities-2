-- Create PMActivity2 Database
-- Run this in MySQL Workbench or command line

-- Create the database
CREATE DATABASE IF NOT EXISTS PMActivity2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE PMActivity2;

-- Verify database creation
SELECT 'PMActivity2 database created successfully!' AS message;
SHOW DATABASES LIKE 'PMActivity2';

-- Show current database
SELECT DATABASE() AS current_database;
