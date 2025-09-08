const mysql = require('mysql2/promise');

async function cleanupNihaData() {
    const connection = await mysql.createConnection({
        host: 'activity-tracker-mysql.mysql.database.azure.com',
        user: 'drtravi',
        password: 'Harith12!',
        database: 'pmactivity2',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Starting comprehensive cleanup of Niha data...');

        // First, get all organization IDs for NihaTechnologies
        const [orgs] = await connection.execute(
            'SELECT id FROM organizations WHERE name LIKE "%niha%" OR name LIKE "%Niha%"'
        );
        
        const orgIds = orgs.map(org => org.id);
        console.log('Found organization IDs:', orgIds);

        if (orgIds.length > 0) {
            // First, let's check the projects table structure
            const [columns] = await connection.execute('DESCRIBE projects');
            console.log('Projects table columns:', columns.map(col => col.Field));

            // Try different possible column names for organization reference
            let orgColumnName = 'organizationId';
            const columnNames = columns.map(col => col.Field);
            if (columnNames.includes('organization_id')) {
                orgColumnName = 'organization_id';
            } else if (columnNames.includes('orgId')) {
                orgColumnName = 'orgId';
            } else if (columnNames.includes('org_id')) {
                orgColumnName = 'org_id';
            }

            console.log('Using organization column name:', orgColumnName);

            // Delete all projects for these organizations
            const [projects] = await connection.execute(
                `SELECT id FROM projects WHERE ${orgColumnName} IN (${orgIds.map(() => '?').join(',')})`,
                orgIds
            );
            
            const projectIds = projects.map(p => p.id);
            console.log('Found project IDs to delete:', projectIds);

            if (projectIds.length > 0) {
                // Check tasks table structure
                const [taskColumns] = await connection.execute('DESCRIBE tasks');
                console.log('Tasks table columns:', taskColumns.map(col => col.Field));

                let taskProjectColumnName = 'projectId';
                const taskColumnNames = taskColumns.map(col => col.Field);
                if (taskColumnNames.includes('project_id')) {
                    taskProjectColumnName = 'project_id';
                }

                // Delete tasks for these projects
                await connection.execute(
                    `DELETE FROM tasks WHERE ${taskProjectColumnName} IN (${projectIds.map(() => '?').join(',')})`,
                    projectIds
                );
                console.log('Deleted tasks for projects');

                // Check project_users table structure
                try {
                    const [projectUserColumns] = await connection.execute('DESCRIBE project_users');
                    console.log('Project_users table columns:', projectUserColumns.map(col => col.Field));

                    let projectUserProjectColumnName = 'projectId';
                    const projectUserColumnNames = projectUserColumns.map(col => col.Field);
                    if (projectUserColumnNames.includes('project_id')) {
                        projectUserProjectColumnName = 'project_id';
                    }

                    // Delete project users
                    await connection.execute(
                        `DELETE FROM project_users WHERE ${projectUserProjectColumnName} IN (${projectIds.map(() => '?').join(',')})`,
                        projectIds
                    );
                    console.log('Deleted project users');
                } catch (error) {
                    console.log('project_users table might not exist or have different structure:', error.message);
                }

                // Delete projects
                await connection.execute(
                    `DELETE FROM projects WHERE id IN (${projectIds.map(() => '?').join(',')})`,
                    projectIds
                );
                console.log('Deleted projects');
            }

            // Check users table structure and delete users from these organizations
            const [userColumns] = await connection.execute('DESCRIBE users');
            console.log('Users table columns:', userColumns.map(col => col.Field));

            let userOrgColumnName = 'organizationId';
            const userColumnNames = userColumns.map(col => col.Field);
            if (userColumnNames.includes('organization_id')) {
                userOrgColumnName = 'organization_id';
            } else if (userColumnNames.includes('orgId')) {
                userOrgColumnName = 'orgId';
            } else if (userColumnNames.includes('org_id')) {
                userOrgColumnName = 'org_id';
            }

            console.log('Using user organization column name:', userOrgColumnName);

            // First delete the organizations (this will handle the foreign key constraint)
            await connection.execute(
                `DELETE FROM organizations WHERE id IN (${orgIds.map(() => '?').join(',')})`,
                orgIds
            );
            console.log('Deleted organizations');

            // Then delete the users
            await connection.execute(
                `DELETE FROM users WHERE ${userOrgColumnName} IN (${orgIds.map(() => '?').join(',')})`,
                orgIds
            );
            console.log('Deleted users');
        }

        // Also clean up any users with @niha.com email that might be orphaned
        await connection.execute(
            'DELETE FROM users WHERE email LIKE "%@niha.com"'
        );
        console.log('Deleted any remaining @niha.com users');

        console.log('Cleanup completed successfully!');

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await connection.end();
    }
}

cleanupNihaData();
