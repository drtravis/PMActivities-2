-- PMActivity2 Complete Database Schema
-- Run this script in MySQL Workbench to create the complete database schema

-- Create and use the database
CREATE DATABASE IF NOT EXISTS PMActivity2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE PMActivity2;

-- 1. Organizations table (Multi-tenant base)
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    industry VARCHAR(255),
    size VARCHAR(255),
    timezone VARCHAR(255),
    currency VARCHAR(255),
    logoUrl VARCHAR(255),
    settings JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Users table (User accounts with RBAC)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    password VARCHAR(255),
    role ENUM('admin', 'pmo', 'project_manager', 'member') DEFAULT 'member',
    isActive BOOLEAN DEFAULT TRUE,
    invitationToken VARCHAR(255),
    invitationExpiresAt TIMESTAMP NULL,
    organizationId VARCHAR(36) NOT NULL,
    preferences JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_users_organization (organizationId),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

-- 3. Projects table (Project management)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    organizationId VARCHAR(36) NOT NULL,
    ownerId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_projects_organization (organizationId),
    INDEX idx_projects_owner (ownerId)
);

-- 4. Project Members (Many-to-many: Projects ↔ Users)
CREATE TABLE IF NOT EXISTS project_members (
    projectId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    PRIMARY KEY (projectId, userId),
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Status Configuration (Customizable status workflows)
CREATE TABLE IF NOT EXISTS status_configuration (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('activity', 'task') NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    isActive BOOLEAN DEFAULT TRUE,
    orderIndex INTEGER DEFAULT 0,
    organizationId VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_status_per_org (name, type, organizationId),
    INDEX idx_status_organization (organizationId),
    INDEX idx_status_type (type)
);

-- 6. Activities table (Activity tracking with approval workflow)
CREATE TABLE IF NOT EXISTS activities (
    id VARCHAR(36) PRIMARY KEY,
    ticketNumber VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    startDate DATE,
    endDate DATE,
    status VARCHAR(50) DEFAULT 'to_do',
    approvalState ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    tags TEXT,
    projectId VARCHAR(36) NOT NULL,
    createdById VARCHAR(36) NOT NULL,
    updatedById VARCHAR(36) NOT NULL,
    approvedById VARCHAR(36),
    approvedAt TIMESTAMP NULL,
    taskId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updatedById) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approvedById) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_activities_project (projectId),
    INDEX idx_activities_status (status),
    INDEX idx_activities_approval (approvalState),
    INDEX idx_activities_created (createdAt),
    INDEX idx_activities_task (taskId),
    INDEX idx_activities_ticket (ticketNumber)
);

-- 7. Activity Assignees (Many-to-many: Activities ↔ Users)
CREATE TABLE IF NOT EXISTS activity_assignees (
    activityId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    PRIMARY KEY (activityId, userId),
    FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Boards table (Personal task boards - Monday.com style)
CREATE TABLE IF NOT EXISTS boards (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    projectId VARCHAR(36),
    ownerId VARCHAR(36) NOT NULL,
    organizationId VARCHAR(36) NOT NULL,
    customColumns JSON DEFAULT ('[]'),
    settings JSON DEFAULT ('{}'),
    isTemplate BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_boards_project (projectId),
    INDEX idx_boards_owner (ownerId),
    INDEX idx_boards_organization (organizationId)
);

-- 9. Tasks table (Task management with Monday.com-style features)
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    boardId VARCHAR(36) NOT NULL,
    projectId VARCHAR(36),
    organizationId VARCHAR(36) NOT NULL,
    createdById VARCHAR(36) NOT NULL,
    assigneeId VARCHAR(36),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'to_do',
    priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
    dueDate TIMESTAMP NULL,
    customData JSON DEFAULT ('{}'),
    tags TEXT,
    position INTEGER DEFAULT 0,
    section VARCHAR(255) DEFAULT 'To-Do',
    isApproved BOOLEAN DEFAULT FALSE,
    approvedById VARCHAR(36),
    approvedAt TIMESTAMP NULL,
    activityId VARCHAR(36),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (boardId) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigneeId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approvedById) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tasks_board (boardId),
    INDEX idx_tasks_assignee (assigneeId),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_due (dueDate),
    INDEX idx_tasks_activity (activityId),
    INDEX idx_tasks_created (createdAt),
    INDEX idx_tasks_organization (organizationId)
);

-- 10. Comments table (Activity and task comments)
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    content TEXT NOT NULL,
    activityId VARCHAR(36),
    createdById VARCHAR(36) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (createdById) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_comments_activity (activityId),
    INDEX idx_comments_created (createdAt)
);

-- 11. Approvals table (Approval workflow tracking)
CREATE TABLE IF NOT EXISTS approvals (
    id VARCHAR(36) PRIMARY KEY,
    taskId VARCHAR(36),
    activityId VARCHAR(36),
    approverId VARCHAR(36) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    comments TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (approverId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_approvals_task (taskId),
    INDEX idx_approvals_activity (activityId),
    INDEX idx_approvals_approver (approverId),
    INDEX idx_approvals_status (status)
);

-- 12. Audit Logs table (Comprehensive audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entityType ENUM('organization', 'user', 'project', 'activity', 'task', 'board', 'comment') NOT NULL,
    entityId VARCHAR(36) NOT NULL,
    action ENUM('create', 'update', 'delete', 'approve', 'reject') NOT NULL,
    userId VARCHAR(36) NOT NULL,
    oldValues JSON,
    newValues JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_audit_entity (entityType, entityId),
    INDEX idx_audit_user (userId),
    INDEX idx_audit_created (createdAt),
    INDEX idx_audit_action (action)
);

-- 13. Task History table (Task change history)
CREATE TABLE IF NOT EXISTS task_history (
    id VARCHAR(36) PRIMARY KEY,
    taskId VARCHAR(36) NOT NULL,
    actorId VARCHAR(36) NOT NULL,
    changeType ENUM('created', 'updated', 'status_changed', 'assigned', 'completed') NOT NULL,
    fieldChanges JSON,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (actorId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_history_task (taskId),
    INDEX idx_task_history_actor (actorId),
    INDEX idx_task_history_created (createdAt)
);

-- 14. Task Comments table (Task-specific comments)
CREATE TABLE IF NOT EXISTS task_comments (
    id VARCHAR(36) PRIMARY KEY,
    taskId VARCHAR(36) NOT NULL,
    authorId VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_comments_task (taskId),
    INDEX idx_task_comments_author (authorId),
    INDEX idx_task_comments_created (createdAt)
);

-- 15. Task Attachments table (File attachments for tasks)
CREATE TABLE IF NOT EXISTS task_attachments (
    id VARCHAR(36) PRIMARY KEY,
    taskId VARCHAR(36) NOT NULL,
    uploadedById VARCHAR(36) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    originalName VARCHAR(255) NOT NULL,
    mimeType VARCHAR(100),
    fileSize INTEGER,
    filePath VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (uploadedById) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_task_attachments_task (taskId),
    INDEX idx_task_attachments_uploader (uploadedById),
    INDEX idx_task_attachments_created (createdAt)
);

-- Insert default status configurations for global use
-- These will be used as fallbacks when organizations don't have custom statuses

-- Create a default organization for global statuses
INSERT IGNORE INTO organizations (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000000', 'System Default', 'Default organization for system-wide configurations');

-- Insert default activity statuses
INSERT IGNORE INTO status_configuration (id, name, type, color, isActive, orderIndex, organizationId) VALUES
('status-todo-activity', 'TODO', 'activity', '#6B7280', TRUE, 1, '00000000-0000-0000-0000-000000000000'),
('status-progress-activity', 'IN_PROGRESS', 'activity', '#3B82F6', TRUE, 2, '00000000-0000-0000-0000-000000000000'),
('status-review-activity', 'REVIEW', 'activity', '#F59E0B', TRUE, 3, '00000000-0000-0000-0000-000000000000'),
('status-done-activity', 'DONE', 'activity', '#10B981', TRUE, 4, '00000000-0000-0000-0000-000000000000');

-- Insert default task statuses
INSERT IGNORE INTO status_configuration (id, name, type, color, isActive, orderIndex, organizationId) VALUES
('status-assigned-task', 'ASSIGNED', 'task', '#8B5CF6', TRUE, 1, '00000000-0000-0000-0000-000000000000'),
('status-progress-task', 'IN_PROGRESS', 'task', '#3B82F6', TRUE, 2, '00000000-0000-0000-0000-000000000000'),
('status-complete-task', 'COMPLETE', 'task', '#10B981', TRUE, 3, '00000000-0000-0000-0000-000000000000');

-- Show completion message
SELECT 'PMActivity2 database schema created successfully!' as Status;
