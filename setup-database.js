const mysql = require('mysql2/promise');
const fs = require('fs');

async function setupDatabase() {
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // Connect to MySQL without specifying a database
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'rootpassword123',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Create database if it doesn't exist
    console.log('🔄 Creating PMActivity2 database...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS PMActivity2');
    console.log('✅ Database PMActivity2 created/verified');

    // Switch to the database
    await connection.query('USE PMActivity2');
    console.log('✅ Using PMActivity2 database');

    // Read and execute the schema file
    console.log('🔄 Reading schema file...');
    const schemaSQL = fs.readFileSync('create-pmactivity2-schema.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await connection.query(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DB_CREATE_EXISTS') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }

    // Insert default status configurations
    console.log('🔄 Inserting default status configurations...');
    
    const defaultStatuses = [
      // Activity statuses
      { id: 'act-todo', name: 'TODO', type: 'activity', isActive: true, orderIndex: 1, color: '#6B7280', organizationId: 'default-org' },
      { id: 'act-progress', name: 'IN_PROGRESS', type: 'activity', isActive: true, orderIndex: 2, color: '#3B82F6', organizationId: 'default-org' },
      { id: 'act-review', name: 'REVIEW', type: 'activity', isActive: true, orderIndex: 3, color: '#F59E0B', organizationId: 'default-org' },
      { id: 'act-done', name: 'DONE', type: 'activity', isActive: true, orderIndex: 4, color: '#10B981', organizationId: 'default-org' },
      
      // Task statuses
      { id: 'task-pending', name: 'PENDING', type: 'task', isActive: true, orderIndex: 1, color: '#6B7280', organizationId: 'default-org' },
      { id: 'task-assigned', name: 'ASSIGNED', type: 'task', isActive: true, orderIndex: 2, color: '#3B82F6', organizationId: 'default-org' },
      { id: 'task-completed', name: 'COMPLETED', type: 'task', isActive: true, orderIndex: 3, color: '#10B981', organizationId: 'default-org' },
      
      // Approval statuses
      { id: 'app-draft', name: 'DRAFT', type: 'approval', isActive: true, orderIndex: 1, color: '#6B7280', organizationId: 'default-org' },
      { id: 'app-submitted', name: 'SUBMITTED', type: 'approval', isActive: true, orderIndex: 2, color: '#F59E0B', organizationId: 'default-org' },
      { id: 'app-approved', name: 'APPROVED', type: 'approval', isActive: true, orderIndex: 3, color: '#10B981', organizationId: 'default-org' },
      { id: 'app-rejected', name: 'REJECTED', type: 'approval', isActive: true, orderIndex: 4, color: '#EF4444', organizationId: 'default-org' }
    ];

    for (const status of defaultStatuses) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO status_configuration (id, name, type, isActive, orderIndex, color, organizationId, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [status.id, status.name, status.type, status.isActive, status.orderIndex, status.color, status.organizationId]
        );
        console.log(`✅ Status configuration inserted: ${status.name} (${status.type})`);
      } catch (error) {
        console.log(`⚠️  Status configuration skipped (already exists): ${status.name}`);
      }
    }

    // Verify the setup
    console.log('🔄 Verifying database setup...');
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables in PMActivity2 database`);
    
    const [statusCount] = await connection.execute('SELECT COUNT(*) as count FROM status_configuration');
    console.log(`✅ Found ${statusCount[0].count} status configurations`);

    await connection.end();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
