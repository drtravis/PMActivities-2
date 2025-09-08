#!/bin/bash

# Task creation script for NihaCore project
# Project Manager creates and assigns tasks to team members

API_BASE="https://pmactivities-backend1.icyhill-61db6701.westus2.azurecontainerapps.io"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3OTFlMDg2OC04YmVmLTExZjAtYjU0Ny02MDQ1YmQ1ZmMzZGYiLCJlbWFpbCI6InBtQG5paGF0ZWsuY29tIiwicm9sZSI6IlBST0pFQ1RfTUFOQUdFUiIsIm9yZ2FuaXphdGlvbklkIjoiZThiMTNiYTMtOGJlZS0xMWYwLWI1NDctNjA0NWJkNWZjM2RmIiwiaWF0IjoxNzU3MjUyODcxLCJleHAiOjE3NTczMzkyNzF9.R67E995xEsaLZd7U18SZjV3CnLoO4ZCXIVyAo_m_YVU"
PROJECT_ID="41e55d66-8bef-11f0-b547-6045bd5fc3df"
MEMBER1_ID="9d101df7-8bef-11f0-b547-6045bd5fc3df"
MEMBER2_ID="b591497a-8bef-11f0-b547-6045bd5fc3df"

# Function to create task
create_task() {
    local title="$1"
    local description="$2"
    local assignee_id="$3"
    local priority="$4"
    local due_date="$5"
    
    echo "Creating task: $title"
    curl -X POST "$API_BASE/api/projects/$PROJECT_ID/tasks" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"description\": \"$description\",
            \"assigneeId\": \"$assignee_id\",
            \"priority\": \"$priority\",
            \"dueDate\": \"$due_date\"
        }" \
        -s | jq -r '.message // .error'
    echo ""
}

echo "Creating remaining 8 tasks for Project Member-1..."

# Tasks 3-10 for Member-1
create_task "Implement Password Reset Functionality" "Build secure password reset flow with email verification, temporary tokens, and password strength validation." "$MEMBER1_ID" "Medium" "2024-09-20"

create_task "Create User Profile Management UI" "Develop responsive user profile pages with edit capabilities, avatar upload, and preference settings." "$MEMBER1_ID" "Medium" "2024-09-25"

create_task "Implement Role-Based Access Control" "Build RBAC system with dynamic permission checking, role assignment, and access level management." "$MEMBER1_ID" "High" "2024-09-18"

create_task "Setup Email Service Integration" "Integrate with email service provider for sending notifications, password resets, and welcome emails." "$MEMBER1_ID" "Medium" "2024-09-22"

create_task "Create API Documentation" "Generate comprehensive API documentation using Swagger/OpenAPI with examples and authentication details." "$MEMBER1_ID" "Low" "2024-09-30"

create_task "Implement Session Management" "Build secure session handling with timeout, concurrent session limits, and session invalidation." "$MEMBER1_ID" "Medium" "2024-09-17"

create_task "Setup Unit Tests for Authentication" "Write comprehensive unit tests for all authentication endpoints with edge cases and security scenarios." "$MEMBER1_ID" "High" "2024-09-28"

create_task "Implement Two-Factor Authentication" "Add 2FA support with TOTP, SMS backup, and recovery codes for enhanced security." "$MEMBER1_ID" "Low" "2024-10-05"

echo "Creating 10 tasks for Project Member-2..."

# Tasks 1-10 for Member-2
create_task "Build Project Dashboard Frontend" "Create responsive dashboard with project overview, task statistics, and progress tracking charts." "$MEMBER2_ID" "High" "2024-09-16"

create_task "Implement Task Management System" "Develop task creation, assignment, status tracking, and priority management with drag-and-drop interface." "$MEMBER2_ID" "Urgent" "2024-09-14"

create_task "Create Real-time Notifications" "Build WebSocket-based notification system for task updates, mentions, and project activities." "$MEMBER2_ID" "Medium" "2024-09-21"

create_task "Design Responsive Mobile Interface" "Create mobile-first responsive design for all major features with touch-friendly interactions." "$MEMBER2_ID" "Medium" "2024-09-26"

create_task "Implement File Upload System" "Build secure file upload with virus scanning, size limits, and cloud storage integration." "$MEMBER2_ID" "High" "2024-09-19"

create_task "Create Advanced Search Functionality" "Implement full-text search across projects, tasks, and comments with filters and sorting options." "$MEMBER2_ID" "Medium" "2024-09-24"

create_task "Setup Performance Monitoring" "Integrate application performance monitoring with error tracking and user experience metrics." "$MEMBER2_ID" "Low" "2024-10-01"

create_task "Implement Data Export Features" "Build export functionality for projects, tasks, and reports in PDF, Excel, and CSV formats." "$MEMBER2_ID" "Low" "2024-10-03"

create_task "Create Integration Tests" "Develop end-to-end integration tests covering critical user workflows and API interactions." "$MEMBER2_ID" "High" "2024-09-27"

create_task "Setup Automated Deployment Pipeline" "Configure CI/CD pipeline with automated testing, staging deployment, and production rollout." "$MEMBER2_ID" "Medium" "2024-09-23"

echo "All tasks created successfully!"
