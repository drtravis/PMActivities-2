-- PMActivities Database Schema for Azure MySQL
-- Run this script after creating your Azure Database for MySQL

-- Create database (if not already created)
CREATE DATABASE IF NOT EXISTS pmactivities;
USE pmactivities;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'PMO', 'PROJECT_MANAGER', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    organizationId VARCHAR(36),
    createdBy VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
);

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
    id VARCHAR(36) PRIMARY KEY,
    projectId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    role ENUM('PROJECT_MANAGER', 'MEMBER') DEFAULT 'MEMBER',
    joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_user (projectId, userId)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Not Started',
    priority VARCHAR(20) DEFAULT 'Medium',
    projectId VARCHAR(36),
    assigneeId VARCHAR(36),
    createdBy VARCHAR(36),
    dueDate DATE,
    estimatedHours DECIMAL(5,2),
    actualHours DECIMAL(5,2),
    progress INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigneeId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('draft', 'in_review', 'approved', 'rejected') DEFAULT 'draft',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    category VARCHAR(100),
    startDate DATE,
    endDate DATE,
    progress INT DEFAULT 0,
    estimatedHours DECIMAL(5,2),
    actualHours DECIMAL(5,2),
    tags JSON,
    projectId VARCHAR(36),
    assigneeId VARCHAR(36),
    createdBy VARCHAR(36),
    taskId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigneeId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Status settings table
CREATE TABLE IF NOT EXISTS status_settings (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    type ENUM('task', 'activity') NOT NULL,
    isDefault BOOLEAN DEFAULT FALSE,
    organizationId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Insert default organization
INSERT IGNORE INTO organizations (id, name, description) 
VALUES ('default-org-id', 'PMActivities Organization', 'Default organization for PMActivities');

-- Insert default admin user (password: Admin123!)
INSERT IGNORE INTO users (id, name, email, password, role) 
VALUES (
    'admin-user-id', 
    'System Admin', 
    'admin@pmactivities.com', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJL9.KeHu', 
    'ADMIN'
);

-- Insert default PMO user (password: PMO123!)
INSERT IGNORE INTO users (id, name, email, password, role) 
VALUES (
    'pmo-user-id', 
    'PMO User', 
    'pmo@pmactivities.com', 
    '$2b$12$8K7QzQzQzQzQzQzQzQzQzOzQzQzQzQzQzQzQzQzQzQzQzQzQzQzQzu', 
    'PMO'
);

-- Insert default status settings
INSERT IGNORE INTO status_settings (id, name, color, type, isDefault, organizationId) VALUES
('status-1', 'Not Started', '#6B7280', 'task', TRUE, 'default-org-id'),
('status-2', 'Working on it', '#3B82F6', 'task', FALSE, 'default-org-id'),
('status-3', 'Stuck', '#EF4444', 'task', FALSE, 'default-org-id'),
('status-4', 'Done', '#10B981', 'task', FALSE, 'default-org-id'),
('status-5', 'Canceled', '#6B7280', 'task', FALSE, 'default-org-id'),
('status-6', 'Draft', '#6B7280', 'activity', TRUE, 'default-org-id'),
('status-7', 'In Review', '#F59E0B', 'activity', FALSE, 'default-org-id'),
('status-8', 'Approved', '#10B981', 'activity', FALSE, 'default-org-id'),
('status-9', 'Rejected', '#EF4444', 'activity', FALSE, 'default-org-id');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_projects_organization ON projects(organizationId);
CREATE INDEX idx_project_members_project ON project_members(projectId);
CREATE INDEX idx_project_members_user ON project_members(userId);
CREATE INDEX idx_tasks_project ON tasks(projectId);
CREATE INDEX idx_tasks_assignee ON tasks(assigneeId);
CREATE INDEX idx_activities_project ON activities(projectId);
CREATE INDEX idx_activities_assignee ON activities(assigneeId);
CREATE INDEX idx_activities_status ON activities(status);

-- Show tables created
SHOW TABLES;
