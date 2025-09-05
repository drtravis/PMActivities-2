-- MySQL Database Initialization Script for PMActivity2
-- This script will be executed when the MySQL container starts for the first time

-- Create the PMActivity2 database if it doesn't exist
CREATE DATABASE IF NOT EXISTS PMActivity2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the PMActivity2 database
USE PMActivity2;

-- Create application user with proper permissions
CREATE USER IF NOT EXISTS 'app_user'@'%' IDENTIFIED BY 'app_password123';
GRANT ALL PRIVILEGES ON PMActivity2.* TO 'app_user'@'%';

-- Create a read-only user for reporting (optional)
CREATE USER IF NOT EXISTS 'report_user'@'%' IDENTIFIED BY 'report_password123';
GRANT SELECT ON PMActivity2.* TO 'report_user'@'%';

-- Update root password to match actual configuration
ALTER USER 'root'@'%' IDENTIFIED BY 'Jairam123!';
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Jairam123!';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Set MySQL settings for better performance and compatibility
SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
SET GLOBAL innodb_file_per_table = 1;
SET GLOBAL innodb_buffer_pool_size = 128M;

-- Create initial tables (TypeORM will handle this, but we can create some basic structure)
-- Note: TypeORM synchronize will create/update tables automatically in development

-- Log the initialization
INSERT INTO mysql.general_log (event_time, user_host, thread_id, server_id, command_type, argument)
VALUES (NOW(), 'init_script', 0, 1, 'Query', 'Database initialized for PMActivities2 application');

-- Display success message
SELECT 'PMActivity2 database initialized successfully!' AS message;
