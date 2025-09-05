# PMActivity2 Database Schema - Complete Details

## 🎯 **Schema Status**

### ❌ **Current Status: NOT CREATED YET**
- **Docker is not running** - MySQL container is not started
- **Database PMActivity2 exists in configuration** but tables are not created
- **Schema will be created automatically** when you start the backend with TypeORM

### ✅ **What Will Be Created**
When you start the system, TypeORM will automatically create **14 tables** with full relationships.

## 🗄️ **Complete Database Schema Definition**

### **1. organizations** (Multi-tenant base)
```sql
CREATE TABLE organizations (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  name VARCHAR(200) NOT NULL,           -- Organization name
  description TEXT,                     -- Optional description
  industry VARCHAR(255),                -- Industry type
  size VARCHAR(255),                    -- Company size
  timezone VARCHAR(255),                -- Default timezone
  currency VARCHAR(255),                -- Default currency
  logoUrl VARCHAR(255),                 -- Logo image URL
  settings JSON,                        -- Organization settings
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

### **2. users** (User accounts with RBAC)
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  email VARCHAR(255) UNIQUE NOT NULL,   -- Login email
  name VARCHAR(200) NOT NULL,           -- Display name
  password VARCHAR(255),                -- Hashed password
  role ENUM('admin', 'pmo', 'project_manager', 'member') DEFAULT 'member',
  isActive BOOLEAN DEFAULT TRUE,        -- Account status
  invitationToken VARCHAR(255),         -- For user invitations
  invitationExpiresAt TIMESTAMP,        -- Token expiry
  organizationId VARCHAR(36) NOT NULL,  -- FK to organizations
  preferences JSON,                     -- User preferences
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (organizationId) REFERENCES organizations(id)
);
```

### **3. projects** (Project management)
```sql
CREATE TABLE projects (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  name VARCHAR(200) NOT NULL,           -- Project name
  description TEXT,                     -- Project description
  organizationId VARCHAR(36) NOT NULL,  -- FK to organizations
  ownerId VARCHAR(36) NOT NULL,         -- FK to users (project owner)
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (organizationId) REFERENCES organizations(id),
  FOREIGN KEY (ownerId) REFERENCES users(id)
);
```

### **4. project_members** (Many-to-many: Projects ↔ Users)
```sql
CREATE TABLE project_members (
  projectId VARCHAR(36) NOT NULL,       -- FK to projects
  userId VARCHAR(36) NOT NULL,          -- FK to users
  PRIMARY KEY (projectId, userId),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### **5. activities** (Activity tracking with approval workflow)
```sql
CREATE TABLE activities (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  ticketNumber VARCHAR(255) UNIQUE NOT NULL, -- Unique ticket ID
  title VARCHAR(200) NOT NULL,          -- Activity title
  description TEXT,                     -- Activity description
  startDate DATE,                       -- Planned start date
  endDate DATE,                         -- Planned end date
  status VARCHAR(50) DEFAULT 'to_do',   -- Dynamic status (references status_configuration)
  approvalState ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  tags TEXT,                           -- Comma-separated tags
  projectId VARCHAR(36) NOT NULL,       -- FK to projects
  createdById VARCHAR(36) NOT NULL,     -- FK to users (creator)
  updatedById VARCHAR(36) NOT NULL,     -- FK to users (last updater)
  approvedById VARCHAR(36),             -- FK to users (approver)
  approvedAt TIMESTAMP,                 -- Approval timestamp
  taskId VARCHAR(36),                   -- Optional FK to originating task
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (createdById) REFERENCES users(id),
  FOREIGN KEY (updatedById) REFERENCES users(id),
  FOREIGN KEY (approvedById) REFERENCES users(id),
  INDEX idx_activities_status (status),
  INDEX idx_activities_approval (approvalState),
  INDEX idx_activities_created (createdAt),
  INDEX idx_activities_task (taskId)
);
```

### **6. activity_assignees** (Many-to-many: Activities ↔ Users)
```sql
CREATE TABLE activity_assignees (
  activityId VARCHAR(36) NOT NULL,      -- FK to activities
  userId VARCHAR(36) NOT NULL,          -- FK to users
  PRIMARY KEY (activityId, userId),
  FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### **7. boards** (Personal task boards - Monday.com style)
```sql
CREATE TABLE boards (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  name VARCHAR(200) NOT NULL,           -- Board name
  description TEXT,                     -- Board description
  projectId VARCHAR(36),                -- Optional FK to projects
  ownerId VARCHAR(36) NOT NULL,         -- FK to users (board owner)
  organizationId VARCHAR(36) NOT NULL,  -- FK to organizations
  customColumns JSON DEFAULT '[]',      -- Custom column definitions
  settings JSON DEFAULT '{}',           -- Board settings and preferences
  isTemplate BOOLEAN DEFAULT FALSE,     -- Template board flag
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (ownerId) REFERENCES users(id),
  FOREIGN KEY (organizationId) REFERENCES organizations(id),
  INDEX idx_boards_project (projectId),
  INDEX idx_boards_owner (ownerId)
);
```

### **8. tasks** (Task management with Monday.com-style features)
```sql
CREATE TABLE tasks (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  boardId VARCHAR(36) NOT NULL,         -- FK to boards (required)
  projectId VARCHAR(36),                -- Optional FK to projects
  organizationId VARCHAR(36) NOT NULL,  -- FK to organizations
  createdById VARCHAR(36) NOT NULL,     -- FK to users (creator)
  assigneeId VARCHAR(36),               -- FK to users (assignee)
  title VARCHAR(200) NOT NULL,          -- Task title
  description TEXT,                     -- Task description
  status VARCHAR(50) DEFAULT 'to_do',   -- Dynamic status
  priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
  dueDate TIMESTAMP,                    -- Due date
  customData JSON DEFAULT '{}',         -- Custom column data
  tags TEXT,                           -- Comma-separated tags
  position INTEGER DEFAULT 0,          -- Drag & drop position
  section VARCHAR(255) DEFAULT 'To-Do', -- Board section
  isApproved BOOLEAN DEFAULT FALSE,     -- Approval status
  approvedById VARCHAR(36),             -- FK to users (approver)
  approvedAt TIMESTAMP,                 -- Approval timestamp
  activityId VARCHAR(36),               -- Optional FK to converted activity
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (boardId) REFERENCES boards(id),
  FOREIGN KEY (projectId) REFERENCES projects(id),
  FOREIGN KEY (organizationId) REFERENCES organizations(id),
  FOREIGN KEY (createdById) REFERENCES users(id),
  FOREIGN KEY (assigneeId) REFERENCES users(id),
  FOREIGN KEY (approvedById) REFERENCES users(id),
  INDEX idx_tasks_board (boardId),
  INDEX idx_tasks_assignee (assigneeId),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_due (dueDate),
  INDEX idx_tasks_activity (activityId),
  INDEX idx_tasks_created (createdAt)
);
```

### **9. comments** (Activity and task comments)
```sql
CREATE TABLE comments (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  content TEXT NOT NULL,                -- Comment text
  activityId VARCHAR(36),               -- FK to activities (nullable)
  createdById VARCHAR(36) NOT NULL,     -- FK to users (author)
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (createdById) REFERENCES users(id)
);
```

### **10. status_configuration** (Customizable status workflows)
```sql
CREATE TABLE status_configuration (
  id VARCHAR(36) PRIMARY KEY,           -- UUID
  name VARCHAR(100) NOT NULL,           -- Status name
  type ENUM('activity', 'task') NOT NULL, -- Entity type
  color VARCHAR(7) DEFAULT '#6B7280',   -- Hex color code
  isActive BOOLEAN DEFAULT TRUE,        -- Status active flag
  orderIndex INTEGER DEFAULT 0,        -- Display order
  organizationId VARCHAR(36) NOT NULL,  -- FK to organizations
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (organizationId) REFERENCES organizations(id),
  UNIQUE KEY unique_status_per_org (name, type, organizationId)
);
```

## 📊 **Additional Support Tables**

### **11. approvals** (Approval workflow tracking)
### **12. audit_logs** (Comprehensive audit trail)
### **13. task_history** (Task change history)
### **14. task_comments** (Task-specific comments)
### **15. task_attachments** (File attachments for tasks)

## 🔧 **How to Create the Schema**

### **Step 1: Start Docker & MySQL**
```bash
# Start MySQL container
./scripts/setup-pmactivity2.sh
```

### **Step 2: Start Backend (Creates Tables)**
```bash
cd activity-tracker/backend
npm run start:dev
```

### **Step 3: Verify Schema Creation**
```bash
# Check tables created
docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "USE PMActivity2; SHOW TABLES;"
```

### **Step 4: View in MySQL Workbench**
- Connection: localhost:3306
- Username: app_user
- Password: app_password123
- Database: PMActivity2

## 🎯 **Schema Features**

✅ **Multi-tenant Architecture** - Organization isolation  
✅ **Role-based Access Control** - 4 user roles  
✅ **Flexible Status System** - Configurable workflows  
✅ **Monday.com-style Boards** - Custom columns & drag-drop  
✅ **Comprehensive Audit Trail** - Full change tracking  
✅ **File Attachments** - Document management  
✅ **Advanced Relationships** - Proper foreign keys  
✅ **Performance Optimized** - Strategic indexes  

**The schema is ready to be created - just start Docker and the backend!** 🚀
