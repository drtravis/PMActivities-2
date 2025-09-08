const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function createFreshNihaData() {
    const connection = await mysql.createConnection({
        host: 'activity-tracker-mysql.mysql.database.azure.com',
        user: 'drtravi',
        password: 'Harith12!',
        database: 'pmactivity2',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Creating fresh NihaTechnologies data...');

        // 1. Create NihaTechnologies organization
        const orgId = uuidv4();
        await connection.execute(
            'INSERT INTO organizations (id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            [orgId, 'NihaTechnologies', 'NihaTechnologies Organization']
        );
        console.log('Created NihaTechnologies organization');

        // 2. Create users with hashed passwords
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash('Niha123', saltRounds);

        const users = [
            { id: uuidv4(), name: 'Administrator', email: 'admin@niha.com', role: 'ADMIN' },
            { id: uuidv4(), name: 'Program Manager', email: 'pmo@niha.com', role: 'PMO' },
            { id: uuidv4(), name: 'Project Manager', email: 'pm@niha.com', role: 'PROJECT_MANAGER' },
            { id: uuidv4(), name: 'ProjectMem1', email: 'member1@niha.com', role: 'MEMBER' },
            { id: uuidv4(), name: 'Project Mem 2', email: 'member2@niha.com', role: 'MEMBER' }
        ];

        for (const user of users) {
            await connection.execute(
                'INSERT INTO users (id, email, password, name, role, organization_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())',
                [user.id, user.email, hashedPassword, user.name, user.role, orgId]
            );
        }
        console.log('Created 5 users');

        // 3. Create NihaCore project
        const projectId = uuidv4();
        const adminUser = users.find(u => u.role === 'ADMIN');
        
        await connection.execute(
            'INSERT INTO projects (id, name, description, organization_id, created_by, owner_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
            [projectId, 'NihaCore', 'Core project for NihaTechnologies', orgId, adminUser.id, adminUser.id, 'active']
        );
        console.log('Created NihaCore project');

        // 4. Create tasks for each member (10 tasks each with 2 different statuses)
        const taskStatuses = ['todo', 'in_progress', 'done', 'blocked'];
        const priorities = ['low', 'medium', 'high'];
        
        const memberUsers = users.filter(u => u.role === 'MEMBER');
        
        for (const member of memberUsers) {
            console.log(`Creating 10 tasks for ${member.name}...`);
            
            for (let i = 1; i <= 10; i++) {
                const taskId = uuidv4();
                const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
                const priority = priorities[Math.floor(Math.random() * priorities.length)];
                
                await connection.execute(
                    'INSERT INTO tasks (id, title, description, status, priority, assignee_id, created_by, project_id, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
                    [
                        taskId,
                        `Task ${i} for ${member.name}`,
                        `This is a meaningful task ${i} assigned to ${member.name}. It involves important work that contributes to the NihaCore project success.`,
                        status,
                        priority,
                        member.id,
                        adminUser.id,
                        projectId,
                        orgId
                    ]
                );
            }
        }

        // 5. Create 10 additional tasks for Project Manager
        const projectManager = users.find(u => u.email === 'pm@niha.com');
        console.log(`Creating 10 tasks for Project Manager...`);
        
        for (let i = 1; i <= 10; i++) {
            const taskId = uuidv4();
            const status = taskStatuses[Math.floor(Math.random() * taskStatuses.length)];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            
            await connection.execute(
                'INSERT INTO tasks (id, title, description, status, priority, assignee_id, created_by, project_id, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
                [
                    taskId,
                    `PM Task ${i}`,
                    `Project management task ${i} - coordinating team activities, monitoring progress, and ensuring project deliverables are met on time.`,
                    status,
                    priority,
                    projectManager.id,
                    adminUser.id,
                    projectId,
                    orgId
                ]
            );
        }

        console.log('Fresh NihaTechnologies data created successfully!');
        console.log('Summary:');
        console.log('- 1 Organization: NihaTechnologies');
        console.log('- 5 Users with different roles');
        console.log('- 1 Project: NihaCore');
        console.log('- 30 Tasks total (10 for each member + 10 for PM)');
        console.log('');
        console.log('Login credentials:');
        console.log('- admin@niha.com / Niha123');
        console.log('- pmo@niha.com / Niha123');
        console.log('- pm@niha.com / Niha123');
        console.log('- member1@niha.com / Niha123');
        console.log('- member2@niha.com / Niha123');

    } catch (error) {
        console.error('Error creating fresh data:', error);
    } finally {
        await connection.end();
    }
}

createFreshNihaData();
