Product Requirements Document (PRD)
Vibe Coder Windsurf AI - Activity Tracking Web App
Project Overview
Product Name: Activity Tracking Web App
Version: v1.0
AI Assistant Target: Vibe Coder Windsurf AI
Deployment: Azure Cloud Platform
Database: PostgreSQL (Azure Database for PostgreSQL)

1. Product Vision & Summary
Vision Statement
Build a multi-tenant, cloud-native Activity Tracking Web App that enables organizations to manage project activities through a structured approval workflow, ensuring accountability and transparency.
Core Value Proposition

For Project Managers: Centralized activity oversight with approval controls and comprehensive reporting
For Employees: Streamlined activity creation and submission process with clear feedback loops
For Organizations: Scalable, secure, and auditable activity management system

Key Differentiators

Approval-based edit locking mechanism
Multi-tenant architecture with role-based access control
Cloud-native deployment on Azure with open-source database
Comprehensive audit trail and reporting capabilities


2. Business Goals & Success Metrics
Primary Goals

Accountability Enhancement: Implement approval-based workflow to ensure activity validation
Operational Efficiency: Reduce manual oversight through automated workflows and notifications
Scalability: Support multiple organizations with isolated data and customizable workflows
Compliance: Maintain comprehensive audit trails for regulatory requirements

Success Metrics (KPIs)

User adoption rate: >80% within 3 months
Average approval time: <24 hours
System uptime: 99.5% SLA compliance
User satisfaction score: >4.0/5.0
Activity completion rate: >85%

Non-Goals (v1.0)

❌ Time tracking and billing functionality
❌ External client portals or public interfaces
❌ Gantt charts or resource allocation tools
❌ Advanced project management features (dependencies, milestones)


3. User Personas & Roles
Primary Users
1. Admin (Organization Level)
Responsibilities:

Organization setup and configuration
User management (create PMs and Members)
System-wide settings and permissions
Global reporting and analytics

Pain Points:

Manual user onboarding processes
Lack of organization-wide visibility
Complex permission management

Goals:

Streamlined user management
Complete organizational oversight
Efficient system administration

2. Project Manager (PM)
Responsibilities:

Activity approval and rejection
Project member management
Reporting and analytics
Tag and workflow management

Pain Points:

Scattered activity information
Manual approval processes
Limited reporting capabilities

Goals:

Centralized activity management
Efficient approval workflows
Comprehensive project insights

3. Member (Employee)
Responsibilities:

Activity creation and editing
Status updates and progress tracking
Collaboration through comments
Submission for approval

Pain Points:

Unclear approval status
Limited activity visibility
Manual status tracking

Goals:

Easy activity management
Clear approval process
Efficient collaboration


4. Core Features & Functional Requirements
4.1 Authentication & User Management
Email-Based Invitation System
Feature: Secure User Onboarding
- Admin/PM sends email invitations
- Magic link or OTP verification
- Automatic role assignment
- Account activation flow
Role-Based Access Control (RBAC)
Access Matrix:
Admin: Full organizational access
PM: Project-level full access + cross-project visibility for reporting
Member: Own activities + assigned activities only
4.2 Activity Management System
Activity Entity Structure
javascriptActivity: {
  id: UUID (Primary Key)
  ticketNumber: String (Unique, Auto-generated)
  title: String (Required, Max 200 chars)
  description: Text (Rich text supported)
  startDate: Date
  endDate: Date
  status: Enum ['in_progress', 'on_hold', 'completed', 'stopped']
  approvalState: Enum ['draft', 'submitted', 'approved', 'closed', 'reopened', 'rejected']
  assignees: Array<User> (One or multiple members)
  tags: Array<String>
  priority: Enum ['low', 'medium', 'high']
  projectId: UUID (Foreign Key)
  createdBy: UUID (Foreign Key)
  updatedBy: UUID (Foreign Key)
  createdAt: Timestamp
  updatedAt: Timestamp
  approvedBy: UUID (Foreign Key, nullable)
  approvedAt: Timestamp (nullable)
}
Activity Lifecycle Workflow
State Machine:
Draft → Submitted → [Approved|Rejected]
Approved → Closed
Approved → Reopened → Submitted
Rejected → Draft
Edit Lock Mechanism
Business Rules:
- Pre-approval: Members can edit/delete own activities
- Post-approval: Activities locked for members
- PM Override: PMs can edit approved activities
- Audit Trail: All changes logged with user and timestamp
4.3 Approval Workflow System
Approval Dashboard (PM)
Features:
- Pending approvals inbox
- Bulk approve/reject functionality
- Activity details modal
- Approval history tracking
- Comment-based feedback system
Notification System
Email Notifications:
- Member: Activity approved/rejected/reopened
- PM: New submissions, activity updates
- Admin: System-wide summaries

In-App Notifications:
- Real-time status updates
- Action required alerts
- System announcements
4.4 Search & Filtering
Advanced Search Capabilities
Search Criteria:
- Ticket number (exact match)
- Title/Description (full-text search)
- Status and approval state
- Assignee selection
- Date ranges (created, updated, due)
- Tags and priority levels
- Project association
Saved Filters (Future v1.1+)
Functionality:
- Custom filter creation
- Shared PM views
- Quick access filters
- Filter templates
4.5 Reporting & Analytics
Standard Reports
1. Activity Status Report
   - Activities by status/state
   - Completion rates
   - Overdue activities

2. Member Performance Report
   - Activities per member
   - Approval success rate
   - Average completion time

3. Approval Aging Report
   - Pending approval duration
   - PM response times
   - Bottleneck identification
Export Capabilities
Formats:
- CSV (Standard)
- XLSX (Excel compatibility)
- PDF (Future consideration)

Data Include:
- Filtered activity lists
- Summary statistics
- Audit trail data
4.6 Comments & Collaboration
Comment System
javascriptComment: {
  id: UUID
  activityId: UUID (Foreign Key)
  body: Text
  createdBy: UUID (Foreign Key)
  createdAt: Timestamp
  visibility: Enum ['public', 'internal'] (Optional v1.1+)
}
Collaboration Features
- Activity-specific comment threads
- @mention notifications (Future)
- Comment visibility controls
- Edit/delete own comments (time-limited)


4.7 Personal Boards (Task Boards)
Overview
- Web application dashboard that provides each user with a configurable task board (similar to Monday.com)
- Every user has their own personal board (default Board: "MyTravi")
- Project Managers can view all members’ boards in a tabular view
- Boards support real-time task management, collaboration, and visualization

2. Core Features
2.1 Task Management
- Add Task
  - + Add task row inside each group (inline add at bottom of group)
  - Global “New Task” button in toolbar
- Editable Columns per Task
  - Task name: inline edit
  - Owner/Assignee: person selector with avatar and initials
  - Status: color-coded dropdown (Working on it, Done, Stuck)
  - Due date: calendar picker (show overdue indicator/red highlight)
  - Priority: Low, Medium, High with color chips
  - Last updated: auto-generated timestamp on change
  - Bulk selection: Checkbox to select multiple tasks for actions

2.2 Groups & Sections
- Tasks organized into groups (e.g., To-Do, Completed)
- Groups are collapsible/expandable
- Color-coded headers for clarity (To-Do: blue, Completed: green)

2.3 Drag-and-Drop
- Reorder tasks within a group
- Move tasks between groups (e.g., drag from To-Do → Completed)
- On move, system auto-updates the Status column accordingly
- Reorder groups (optional enhancement)

3. Filters & Views
- Search box (keyword search across tasks)
- Filter by: owner, status, due date, priority
- Sort by any column (ascending/descending)
- Hide/Show columns toggle
- Group by option: dynamically group tasks by status, owner, or priority
- View Modes: Table (default), Kanban, Calendar, Timeline

4. Visualization & Indicators
- Color-coded status (orange=Working, green=Done, red=Stuck)
- Due date alerts: red highlight for overdue
- Timeline bars below tasks for visual date ranges

5. Collaboration
- Owner avatars visible in board rows
- Invite members via email to collaborate on board
- Project Manager dashboard: see all members’ boards, filter by member/project

6. Automation & Integration
- Automation rules (e.g., notify owner when task is overdue, auto-move to “Completed” after approval)
- Integration hooks (future-ready: Slack, Gmail, Jira, Teams)

7. User & Access
- Login system (email + password)
- Roles & Permissions
  - Admin: creates organizations, projects, and users
  - Project Manager: manages project members & views all boards
  - Member: manages personal tasks and boards
- Permission control: Members see only their own tasks; PM/Admin see all

8. General UI/UX
- Inline editing: All fields directly editable
- Real-time updates (no page reloads)
- Notifications panel for updates
- Responsive design (desktop + mobile)
- Dark/light theme (optional)

Acceptance Criteria (Boards)
- Table view is default for My Activities and matches Monday.com style
- Users can add, edit, drag, filter, sort, and switch views without page reloads
- PMs can view all boards in a consolidated tabular view and filter by user/project
- Moving a task between groups updates its Status automatically and persists to backend
- Overdue tasks display a red indicator

5. Technical Architecture & Implementation
5.1 Technology Stack
Frontend Stack
Primary: React.js 18+
Framework: Next.js 14+ (App Router)
Styling: TailwindCSS 3+
State Management: Zustand or Redux Toolkit
UI Components: Headless UI + Custom components
Type Safety: TypeScript 5+
Backend Stack
Runtime: Node.js 18+ LTS
Framework: NestJS (recommended) or Express.js
API Design: REST + GraphQL (Apollo Server)
Authentication: JWT + Azure AD (optional SSO)
Validation: Joi or Zod
ORM: Prisma or TypeORM
Database Design
sql-- Core Tables Structure
Users: id, email, name, role, organizationId, isActive, createdAt, updatedAt
Organizations: id, name, settings, createdAt, updatedAt
Projects: id, name, description, organizationId, ownerId, members[], createdAt
Activities: id, ticketNumber, title, description, status, approvalState, projectId, assignees[], tags[], priority, dates, audit_fields
Comments: id, activityId, userId, body, createdAt
AuditLogs: id, entityType, entityId, action, changes, userId, timestamp
5.2 Azure Cloud Architecture
Deployment Options
Option 1: Azure App Service (Recommended for MVP)
- Web App: Frontend (Next.js)
- API App: Backend (NestJS)
- Easy scaling and management

Option 2: Azure Kubernetes Service (AKS)
- Container orchestration
- Advanced scaling capabilities
- Complex setup, recommended for scale
Azure Services Integration
Core Services:
- Azure Database for PostgreSQL (Managed)
- Azure App Service or AKS
- Azure Storage Account (file attachments v1.1+)
- Azure Monitor + Log Analytics
- Azure Key Vault (secrets management)
- Azure CDN (static asset delivery)

Optional Services:
- Azure AD (SSO integration)
- Azure Service Bus (async processing)
- Azure Cache for Redis (performance)
5.3 Security Requirements
Authentication & Authorization
Implementation:
- JWT token-based authentication
- Role-based access control (RBAC)
- Azure AD integration (optional SSO)
- Password policy enforcement (if not SSO)
- Session management and timeout
Data Security
Requirements:
- HTTPS/TLS encryption in transit
Board & Task Board Endpoints
Boards
GET    /api/boards/me                 // Get current user's board(s)
POST   /api/boards                     // Create a new personal board
GET    /api/boards/:id                 // Get board details
PUT    /api/boards/:id                 // Update board (name, groups, columns)
DELETE /api/boards/:id                 // Delete board

PM Dashboard
GET    /api/boards                      // List boards (PM/Admin)
GET    /api/boards?owner=:userId        // Filter by owner
GET    /api/boards/projects/:projectId  // Boards/tasks by project

Board Tasks
GET    /api/boards/:boardId/tasks                  // List tasks in board (with filters)
POST   /api/boards/:boardId/tasks                  // Create a new task in a board
PATCH  /api/boards/tasks/:taskId                   // Update a task (inline edits)
DELETE /api/boards/tasks/:taskId                   // Delete a task
PATCH  /api/boards/tasks/:taskId/move              // Move task between groups (updates status)
PATCH  /api/boards/tasks/bulk                      // Bulk updates (status, owner, priority)
GET    /api/boards/tasks/:taskId/history           // Task history and audit trail
POST   /api/boards/tasks/:taskId/approve           // Optional: approve flow integration
POST   /api/boards/tasks/:taskId/reject            // Optional: reject flow integration

Real-time
WS     /ws/boards/:boardId                          // Subscribe to board updates
Event  task.updated | task.moved | task.created | task.deleted

- Database encryption at rest
- Salted password hashing (bcrypt)
- Input validation and sanitization
- SQL injection prevention
- XSS protection
Compliance & Auditing
Features:
- Immutable audit logs
- User activity tracking
- Data retention policies
- Soft delete with recovery (90 days)
- GDPR compliance considerations
5.4 Performance Requirements
Response Time Targets
API Endpoints:
- Authentication: <200ms p95
- Activity CRUD: <300ms p95
- Search/Filter: <500ms p95
- Reports: <2s p95
- Bulk operations: <5s p95
Scalability Targets
Concurrent Users: 1000+ per organization
Activities per Project: 10,000+ with maintained performance
Database Size: 100GB+ with optimized queries
Uptime SLA: 99.5% availability

6. User Experience (UX) Requirements
6.1 Design Principles
1. Clarity: Clear information hierarchy and intuitive navigation
2. Efficiency: Minimize clicks and cognitive load
3. Consistency: Uniform design patterns across all interfaces
4. Accessibility: WCAG 2.1 AA compliance
5. Responsiveness: Mobile-first, responsive design
6.2 Key User Flows
Member Activity Creation Flow
1. Navigate to "My Activities" → "Create New"
2. Fill activity form (title, description, dates, priority)
3. Add tags and assign additional members (optional)
4. Save as draft OR Submit for approval
5. Receive confirmation and status tracking
PM Approval Flow
1. Navigate to "Approvals" dashboard
2. View pending activities list
3. Select activity → Review details
4. Add comments (if needed)
5. Approve/Reject with one-click action
6. Bulk approve multiple activities
Admin User Management Flow
1. Navigate to "Users" section
2. Send email invitation with role assignment
3. Track invitation status
4. Manage user roles and permissions
5. Monitor system usage and reports
6.3 Interface Requirements
Responsive Design
Breakpoints:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

Mobile-First Approach:
- Touch-friendly interface elements
- Collapsible navigation
- Optimized data tables
- Swipe actions for mobile
Accessibility
WCAG 2.1 AA Compliance:
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios >4.5:1
- Alt text for images
- Focus indicators
- Form labeling and validation

7. API Design & Integration
7.1 REST API Endpoints
Authentication Endpoints
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/invite
POST /api/auth/verify-invitation
Activity Management
GET    /api/activities              // List with filters
POST   /api/activities              // Create new
GET    /api/activities/:id          // Get details
PUT    /api/activities/:id          // Update
DELETE /api/activities/:id          // Soft delete
POST   /api/activities/:id/submit   // Submit for approval
POST   /api/activities/:id/approve  // Approve (PM only)
POST   /api/activities/:id/reject   // Reject (PM only)
User Management
GET    /api/users                   // List users (Admin)
POST   /api/users                   // Create user (Admin)
GET    /api/users/:id               // Get user details
PUT    /api/users/:id               // Update user
DELETE /api/users/:id               // Deactivate user
7.2 GraphQL Schema (Optional)
graphqltype Activity {
  id: ID!
  ticketNumber: String!
  title: String!
  description: String
  status: ActivityStatus!
  approvalState: ApprovalState!
  assignees: [User!]!
  tags: [String!]!
  priority: Priority!
  project: Project!
  createdBy: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  activities(filter: ActivityFilter, pagination: Pagination): ActivityConnection!
  activity(id: ID!): Activity
  myActivities: [Activity!]!
}

type Mutation {
  createActivity(input: CreateActivityInput!): Activity!
  updateActivity(id: ID!, input: UpdateActivityInput!): Activity!
  submitActivity(id: ID!): Activity!
  approveActivity(id: ID!, comment: String): Activity!
  rejectActivity(id: ID!, comment: String!): Activity!
}

8. Testing Strategy
8.1 Testing Levels
Unit Tests:
- Individual function testing
- Component testing (React)
- Service layer testing
- Utility function testing
- Target: >90% code coverage

Integration Tests:
- API endpoint testing
- Database integration
- Authentication flows
- Third-party service integration

End-to-End Tests:
- Critical user journeys
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks
8.2 Quality Assurance
Manual Testing:
- User acceptance testing (UAT)
- Accessibility testing
- Security testing
- Performance testing
- Multi-browser testing

Automated Testing:
- CI/CD pipeline integration
- Automated regression testing
- Load testing
- Security scanning

9. Deployment & DevOps
9.1 CI/CD Pipeline
Source Control: Git (GitHub/Azure DevOps)
Build Process: GitHub Actions or Azure Pipelines
Deployment Stages:
1. Development → Feature branch testing
2. Staging → Integration testing
3. Production → Blue-green deployment

Automated Processes:
- Code linting and formatting
- Unit test execution
- Security vulnerability scanning
- Performance testing
- Database migrations
9.2 Environment Configuration
Development:
- Local PostgreSQL
- Mock Azure services
- Hot reloading enabled

Staging:
- Azure Database for PostgreSQL
- Limited Azure services
- Production-like data

Production:
- Full Azure infrastructure
- Monitoring and alerting
- Backup and disaster recovery

10. Monitoring & Analytics
10.1 Application Monitoring
Azure Monitor Integration:
- Application Insights
- Performance metrics
- Error tracking
- User behavior analytics

Custom Metrics:
- Activity creation rates
- Approval processing times
- User engagement metrics
- System performance KPIs
10.2 Logging Strategy
Log Levels:
- ERROR: System errors and exceptions
- WARN: Performance issues and deprecations
- INFO: User actions and system events
- DEBUG: Development and troubleshooting

Log Aggregation:
- Azure Log Analytics
- Structured JSON logging
- Correlation ID tracking
- Security event logging

11. MVP Development Roadmap
11.1 Phase 1: Core Foundation (Weeks 1-4)
Sprint 1-2: Setup & Authentication
- Project setup and configuration
- Azure infrastructure setup
- User authentication system
- Basic user management

Sprint 3-4: Activity Management
- Activity CRUD operations
- Basic approval workflow
- Database schema implementation
- API endpoint development
11.2 Phase 2: Core Features (Weeks 5-8)
Sprint 5-6: Workflow & UI
- Activity lifecycle implementation
- Frontend UI development
- Role-based access control
- Basic search and filtering

Sprint 7-8: Collaboration & Notifications
- Comment system
- Email notification system
- Approval dashboard
- Member activity views
11.3 Phase 3: Enhancement & Testing (Weeks 9-12)
Sprint 9-10: Reporting & Analytics
- Report generation system
- CSV/XLSX export functionality
- Audit logging implementation
- Performance optimization

Sprint 11-12: Testing & Deployment
- Comprehensive testing
- Security audit
- Performance testing
- Production deployment

12. Future Enhancements (v1.1+)
12.1 Planned Features
Bulk Operations:
- CSV import for activities
- Bulk activity updates
- Mass approval actions

Enhanced Collaboration:
- File attachments
- @mention system
- Activity templates
- Shared PM views

Integrations:
- Slack notifications
- Microsoft Teams integration
- Webhook system
- Calendar integration

Advanced Features:
- SLA-based reminders
- Custom workflow states
- Advanced reporting
- Mobile app development
12.2 Technical Improvements
Performance:
- Redis caching layer
- Database optimization
- CDN implementation
- GraphQL subscriptions

Security:
- Advanced audit trails
- Compliance reporting
- Single sign-on expansion
- API rate limiting

User Experience:
- Offline capabilities
- Real-time updates
- Advanced search
- Customizable dashboards

13. Success Criteria & Acceptance
13.1 MVP Acceptance Criteria
Functional Requirements ✓
- User authentication and role management
- Activity CRUD with approval workflow
- Search and filtering capabilities
- Basic reporting and export
- Email notifications
- Audit trail logging

Non-Functional Requirements ✓
- 99.5% uptime SLA
- <300ms response time for core operations
- WCAG 2.1 AA accessibility compliance
- Mobile-responsive design
- Security best practices implementation
13.2 Go-Live Checklist
Technical Validation:
□ All automated tests passing
□ Performance benchmarks met
□ Security scan completed
□ Backup and recovery tested
□ Monitoring and alerting configured

Business Validation:
□ User acceptance testing completed
□ Training materials prepared
□ Support documentation created
□ Data migration plan executed
□ Rollback plan documented