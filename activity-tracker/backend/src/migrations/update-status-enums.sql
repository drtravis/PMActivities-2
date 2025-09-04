-- Migration to update status enums with comprehensive workflow statuses
-- This replaces the old Monday.com style statuses with the new comprehensive workflow statuses

-- Drop existing enum values and recreate with new values
-- Note: This will require updating existing data

-- First, update any existing data to use temporary values
UPDATE tasks SET status = 'To Do' WHERE status = 'Not Started';
UPDATE tasks SET status = 'In Progress' WHERE status = 'Working on it';
UPDATE tasks SET status = 'Completed' WHERE status = 'Done';
UPDATE tasks SET status = 'On Hold' WHERE status = 'Stuck';
UPDATE tasks SET status = 'On Hold' WHERE status = 'Blocked';
UPDATE tasks SET status = 'Closed' WHERE status = 'Canceled';

UPDATE activities SET status = 'To Do' WHERE status = 'Not Started';
UPDATE activities SET status = 'In Progress' WHERE status = 'Working on it';
UPDATE activities SET status = 'Completed' WHERE status = 'Done';
UPDATE activities SET status = 'On Hold' WHERE status = 'Stuck';
UPDATE activities SET status = 'On Hold' WHERE status = 'Blocked';
UPDATE activities SET status = 'Closed' WHERE status = 'Canceled';

-- Drop and recreate the tasks_status_enum
DROP TYPE IF EXISTS tasks_status_enum CASCADE;
CREATE TYPE tasks_status_enum AS ENUM (
    'To Do',
    'Assigned', 
    'In Progress',
    'Completed',
    'Backlog',
    'On Hold',
    'In Review',
    'Approved',
    'Closed'
);

-- Drop and recreate the activities_status_enum
DROP TYPE IF EXISTS activities_status_enum CASCADE;
CREATE TYPE activities_status_enum AS ENUM (
    'To Do',
    'Assigned',
    'In Progress', 
    'Completed',
    'Backlog',
    'On Hold',
    'In Review',
    'Approved',
    'Closed'
);

-- Recreate the tables with the new enum types
-- This is necessary because dropping the enum CASCADE drops the columns

-- Backup existing data
CREATE TEMP TABLE tasks_backup AS SELECT * FROM tasks;
CREATE TEMP TABLE activities_backup AS SELECT * FROM activities;

-- Drop and recreate tasks table
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar NOT NULL,
    description text,
    status tasks_status_enum DEFAULT 'To Do',
    priority varchar DEFAULT 'Medium',
    "assignedToId" uuid,
    "createdById" uuid,
    "projectId" uuid,
    "boardId" uuid,
    "estimatedHours" integer DEFAULT 0,
    "actualHours" integer DEFAULT 0,
    "startDate" timestamp,
    "endDate" timestamp,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now(),
    CONSTRAINT "FK_tasks_assignedTo" FOREIGN KEY ("assignedToId") REFERENCES users(id),
    CONSTRAINT "FK_tasks_createdBy" FOREIGN KEY ("createdById") REFERENCES users(id),
    CONSTRAINT "FK_tasks_project" FOREIGN KEY ("projectId") REFERENCES projects(id),
    CONSTRAINT "FK_tasks_board" FOREIGN KEY ("boardId") REFERENCES boards(id)
);

-- Drop and recreate activities table  
DROP TABLE IF EXISTS activities CASCADE;
CREATE TABLE activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title varchar NOT NULL,
    description text,
    status activities_status_enum DEFAULT 'To Do',
    priority varchar DEFAULT 'Medium',
    category varchar,
    "assignedToId" uuid,
    "createdById" uuid,
    "projectId" uuid,
    "estimatedHours" integer DEFAULT 0,
    "actualHours" integer DEFAULT 0,
    "startDate" timestamp,
    "endDate" timestamp,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now(),
    CONSTRAINT "FK_activities_assignedTo" FOREIGN KEY ("assignedToId") REFERENCES users(id),
    CONSTRAINT "FK_activities_createdBy" FOREIGN KEY ("createdById") REFERENCES users(id),
    CONSTRAINT "FK_activities_project" FOREIGN KEY ("projectId") REFERENCES projects(id)
);

-- Restore data with status mapping
INSERT INTO tasks SELECT 
    id, title, description, 
    CASE 
        WHEN status = 'Not Started' THEN 'To Do'::tasks_status_enum
        WHEN status = 'Working on it' THEN 'In Progress'::tasks_status_enum
        WHEN status = 'Done' THEN 'Completed'::tasks_status_enum
        WHEN status = 'Stuck' THEN 'On Hold'::tasks_status_enum
        WHEN status = 'Blocked' THEN 'On Hold'::tasks_status_enum
        WHEN status = 'Canceled' THEN 'Closed'::tasks_status_enum
        ELSE 'To Do'::tasks_status_enum
    END,
    priority, "assignedToId", "createdById", "projectId", "boardId",
    "estimatedHours", "actualHours", "startDate", "endDate", "createdAt", "updatedAt"
FROM tasks_backup;

INSERT INTO activities SELECT 
    id, title, description,
    CASE 
        WHEN status = 'Not Started' THEN 'To Do'::activities_status_enum
        WHEN status = 'Working on it' THEN 'In Progress'::activities_status_enum  
        WHEN status = 'Done' THEN 'Completed'::activities_status_enum
        WHEN status = 'Stuck' THEN 'On Hold'::activities_status_enum
        WHEN status = 'Blocked' THEN 'On Hold'::activities_status_enum
        WHEN status = 'Canceled' THEN 'Closed'::activities_status_enum
        ELSE 'To Do'::activities_status_enum
    END,
    priority, category, "assignedToId", "createdById", "projectId",
    "estimatedHours", "actualHours", "startDate", "endDate", "createdAt", "updatedAt"
FROM activities_backup;

-- Clean up temp tables
DROP TABLE tasks_backup;
DROP TABLE activities_backup;

-- Create indexes
CREATE INDEX "IDX_tasks_status" ON tasks(status);
CREATE INDEX "IDX_tasks_assignedTo" ON tasks("assignedToId");
CREATE INDEX "IDX_tasks_project" ON tasks("projectId");
CREATE INDEX "IDX_activities_status" ON activities(status);
CREATE INDEX "IDX_activities_assignedTo" ON activities("assignedToId");
CREATE INDEX "IDX_activities_project" ON activities("projectId");
