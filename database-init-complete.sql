-- Complete Database Initialization Script for PM Activities 2
-- Run this script in MySQL Workbench after connecting to your Azure MySQL server

-- Create database
CREATE DATABASE IF NOT EXISTS pmactivity2;
USE pmactivity2;

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_by (created_by)
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'PROJECT_MANAGER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
  organization_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_organization (organization_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED') DEFAULT 'ACTIVE',
  start_date DATE,
  end_date DATE,
  organization_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_organization (organization_id),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'assigned',
  priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  due_date DATETIME,
  assignee_id VARCHAR(36),
  project_id VARCHAR(36),
  organization_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_assignee (assignee_id),
  INDEX idx_project (project_id),
  INDEX idx_organization (organization_id),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'TODO',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  category VARCHAR(100),
  start_date DATETIME,
  end_date DATETIME,
  progress INT DEFAULT 0,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  assigned_to VARCHAR(36),
  project_id VARCHAR(36),
  organization_id VARCHAR(36) NOT NULL,
  created_by VARCHAR(36),
  updated_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_project (project_id),
  INDEX idx_organization (organization_id),
  INDEX idx_status (status),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create status_configurations table
CREATE TABLE IF NOT EXISTS status_configurations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type ENUM('task', 'activity', 'approval') NOT NULL,
  name VARCHAR(100) NOT NULL,
  displayName VARCHAR(100),
  color VARCHAR(7) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  isDefault BOOLEAN NOT NULL DEFAULT FALSE,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  organization_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_type_name_org (type, name, organization_id),
  INDEX idx_type (type),
  INDEX idx_organization (organization_id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Insert default status configurations (global)
INSERT INTO status_configurations (id, type, name, displayName, color, `order`, isDefault, isActive, organization_id) VALUES
('status-1', 'task', 'To Do', 'To Do', '#6B7280', 1, true, true, NULL),
('status-2', 'task', 'In Progress', 'In Progress', '#3B82F6', 2, false, true, NULL),
('status-3', 'task', 'In Review', 'In Review', '#F59E0B', 3, false, true, NULL),
('status-4', 'task', 'Done', 'Done', '#10B981', 4, false, true, NULL),
('status-5', 'activity', 'TODO', 'To Do', '#6B7280', 1, true, true, NULL),
('status-6', 'activity', 'IN_PROGRESS', 'In Progress', '#3B82F6', 2, false, true, NULL),
('status-7', 'activity', 'REVIEW', 'Review', '#F59E0B', 3, false, true, NULL),
('status-8', 'activity', 'DONE', 'Done', '#10B981', 4, false, true, NULL)
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Create default organization
INSERT INTO organizations (id, name, description, created_at) VALUES
('default-org-1', 'Test Organization', 'Default organization for testing', NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Create test users
INSERT INTO users (id, email, password, name, role, organization_id) VALUES
('pm-user-1', 'pm@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Project Manager', 'PROJECT_MANAGER', 'default-org-1'),
('member-user-1', 'member@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Team Member', 'MEMBER', 'default-org-1'),
('admin-user-1', 'admin@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'ADMIN', 'default-org-1')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Create sample project
INSERT INTO projects (id, name, description, status, organization_id, created_by) VALUES
('project-1', 'Sample Project', 'A sample project for testing', 'ACTIVE', 'default-org-1', 'pm-user-1')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Create sample tasks
INSERT INTO tasks (id, title, description, status, priority, assignee_id, project_id, organization_id, created_by) VALUES
('task-1', 'Task 1', 'First sample task', 'assigned', 'Medium', 'member-user-1', 'project-1', 'default-org-1', 'pm-user-1'),
('task-2', 'Task 2', 'Second sample task', 'assigned', 'High', 'member-user-1', 'project-1', 'default-org-1', 'pm-user-1'),
('task-3', 'Task 3', 'Third sample task', 'In Progress', 'Low', 'member-user-1', 'project-1', 'default-org-1', 'pm-user-1'),
('task-4', 'Task 4', 'Fourth sample task', 'assigned', 'High', 'member-user-1', 'project-1', 'default-org-1', 'pm-user-1')
ON DUPLICATE KEY UPDATE updated_at = NOW();

-- Verify installation
SELECT 'Database Setup Complete' as Status;
SELECT COUNT(*) as 'Status Configurations' FROM status_configurations;
SELECT COUNT(*) as 'Organizations' FROM organizations;
SELECT COUNT(*) as 'Users' FROM users;
SELECT COUNT(*) as 'Projects' FROM projects;
SELECT COUNT(*) as 'Tasks' FROM tasks;

-- Show test login credentials
SELECT 'Test Login Credentials:' as Info;
SELECT email, name, role FROM users WHERE organization_id = 'default-org-1';
SELECT 'Password for all test users: password' as Note;
