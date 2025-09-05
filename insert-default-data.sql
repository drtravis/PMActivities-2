-- Insert Default Data for PMActivity2
-- Run this after creating the schema to populate default status configurations

USE PMActivity2;

-- First, create a default organization (required for status configurations)
INSERT IGNORE INTO organizations (id, name, description, createdAt, updatedAt) VALUES
('default-org-id', 'Default Organization', 'System default organization for initial setup', NOW(), NOW());

-- Insert default status configurations for activities
INSERT IGNORE INTO status_configuration (id, name, type, color, isActive, orderIndex, organizationId, createdAt, updatedAt) VALUES
('default-activity-todo', 'To Do', 'activity', '#6B7280', TRUE, 1, 'default-org-id', NOW(), NOW()),
('default-activity-progress', 'In Progress', 'activity', '#3B82F6', TRUE, 2, 'default-org-id', NOW(), NOW()),
('default-activity-review', 'In Review', 'activity', '#F59E0B', TRUE, 3, 'default-org-id', NOW(), NOW()),
('default-activity-done', 'Done', 'activity', '#10B981', TRUE, 4, 'default-org-id', NOW(), NOW());

-- Insert default status configurations for tasks
INSERT IGNORE INTO status_configuration (id, name, type, color, isActive, orderIndex, organizationId, createdAt, updatedAt) VALUES
('default-task-todo', 'To Do', 'task', '#6B7280', TRUE, 1, 'default-org-id', NOW(), NOW()),
('default-task-progress', 'Working on it', 'task', '#3B82F6', TRUE, 2, 'default-org-id', NOW(), NOW()),
('default-task-stuck', 'Stuck', 'task', '#EF4444', TRUE, 3, 'default-org-id', NOW(), NOW()),
('default-task-done', 'Done', 'task', '#10B981', TRUE, 4, 'default-org-id', NOW(), NOW());

-- Verification queries
SELECT 'Default data inserted successfully!' AS message;

SELECT 'Organizations:' AS section;
SELECT id, name, description FROM organizations;

SELECT 'Status Configurations:' AS section;
SELECT id, name, type, color, isActive, orderIndex FROM status_configuration ORDER BY type, orderIndex;

SELECT 'Summary:' AS section;
SELECT 
    (SELECT COUNT(*) FROM organizations) AS organizations_count,
    (SELECT COUNT(*) FROM status_configuration) AS status_configs_count,
    (SELECT COUNT(*) FROM status_configuration WHERE type = 'activity') AS activity_statuses,
    (SELECT COUNT(*) FROM status_configuration WHERE type = 'task') AS task_statuses;
