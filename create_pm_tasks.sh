#!/bin/bash

# PM Self-Assigned Tasks Creation Script
# Project Manager creates tasks for their own PM responsibilities

API_BASE="https://pmactivities-backend1.icyhill-61db6701.westus2.azurecontainerapps.io"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3OTFlMDg2OC04YmVmLTExZjAtYjU0Ny02MDQ1YmQ1ZmMzZGYiLCJlbWFpbCI6InBtQG5paGF0ZWsuY29tIiwicm9sZSI6IlBST0pFQ1RfTUFOQUdFUiIsIm9yZ2FuaXphdGlvbklkIjoiZThiMTNiYTMtOGJlZS0xMWYwLWI1NDctNjA0NWJkNWZjM2RmIiwiaWF0IjoxNzU3MjUzMTYxLCJleHAiOjE3NTczMzk1NjF9.8jas54-H0m4NczRI9lEqrpVszzHFZvTyn2lKkp5lLTg"
PROJECT_ID="41e55d66-8bef-11f0-b547-6045bd5fc3df"
PM_ID="791e0868-8bef-11f0-b547-6045bd5fc3df"

# Function to create PM task (self-assigned)
create_pm_task() {
    local title="$1"
    local description="$2"
    local priority="$3"
    local due_date="$4"
    
    echo "Creating PM task: $title"
    curl -X POST "$API_BASE/api/projects/$PROJECT_ID/tasks" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"title\": \"$title\",
            \"description\": \"$description\",
            \"assigneeId\": \"$PM_ID\",
            \"priority\": \"$priority\",
            \"dueDate\": \"$due_date\"
        }" \
        -s | jq -r '.message // .error'
    echo ""
}

echo "Creating 6 PM self-assigned tasks..."

# PM Task 1: Project Documentation
create_pm_task "Create Project Requirements Document" "Develop comprehensive PRD including functional requirements, technical specifications, user stories, and acceptance criteria for NihaCore project." "High" "2024-09-13"

# PM Task 2: Code Review Process
create_pm_task "Conduct Weekly Code Review Sessions" "Schedule and conduct weekly code review meetings with development team. Review pull requests, ensure coding standards, and provide technical feedback." "Medium" "2024-09-20"

# PM Task 3: Design Review
create_pm_task "Review UI/UX Design Specifications" "Evaluate and approve UI/UX designs for dashboard, task management interface, and mobile responsiveness. Ensure alignment with user requirements." "High" "2024-09-18"

# PM Task 4: Sprint Planning
create_pm_task "Plan and Execute Sprint Planning Sessions" "Organize bi-weekly sprint planning meetings, define sprint goals, estimate story points, and assign tasks based on team capacity and priorities." "High" "2024-09-16"

# PM Task 5: Stakeholder Communication
create_pm_task "Prepare Weekly Status Reports" "Create detailed weekly progress reports for stakeholders including task completion status, blockers, risks, and upcoming milestones. Present to PMO and leadership." "Medium" "2024-09-27"

# PM Task 6: Quality Assurance
create_pm_task "Establish Testing and QA Framework" "Define testing strategy, create test plans, establish QA processes, and coordinate with team for integration testing and user acceptance testing." "High" "2024-09-25"

echo "All PM tasks created successfully!"
