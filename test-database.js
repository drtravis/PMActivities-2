const mysql = require('mysql2/promise');

async function testDatabase() {
  console.log('🔍 Testing PMActivities2 Database Implementation...\n');

  // Standardized connection configuration for activity-tracker-mysql server
  const configs = [
    {
      host: 'activity-tracker-mysql.mysql.database.azure.com',
      port: 3306,
      user: 'drtravi',
      password: process.env.DB_PASSWORD || '',
      database: 'pmactivity2',
      ssl: { rejectUnauthorized: false }
    }
  ];

  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.log(`📡 Trying connection ${i + 1}: ${config.host}:${config.port} with user '${config.user}'`);
    
    try {
      const connection = await mysql.createConnection(config);
      console.log('✅ Database connection successful!');
      
      // Test if database exists
      const [databases] = await connection.query('SHOW DATABASES');
      const dbExists = databases.some(db => db.Database === 'pmactivity2');
      console.log(`📊 pmactivity2 database exists: ${dbExists ? '✅ YES' : '❌ NO'}`);

      if (dbExists) {
        // Test tables
        await connection.query('USE pmactivity2');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`📋 Tables found: ${tables.length}`);
        
        if (tables.length > 0) {
          console.log('📝 Table list:');
          tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
          });
          
          // Test status_configuration table (key for dynamic status system)
          try {
            const [statusConfigs] = await connection.query('SELECT * FROM status_configuration LIMIT 5');
            console.log(`🎯 Status configurations found: ${statusConfigs.length}`);
            if (statusConfigs.length > 0) {
              console.log('📊 Sample status configurations:');
              statusConfigs.forEach(config => {
                console.log(`   - ${config.name} (${config.type}) - Order: ${config.orderIndex}`);
              });
            }
          } catch (error) {
            console.log('⚠️  Status configuration table not accessible:', error.message);
          }

          // Test organizations table
          try {
            const [orgs] = await connection.query('SELECT * FROM organizations LIMIT 3');
            console.log(`🏢 Organizations found: ${orgs.length}`);
          } catch (error) {
            console.log('⚠️  Organizations table not accessible:', error.message);
          }

          // Test users table
          try {
            const [users] = await connection.query('SELECT id, name, email, role FROM users LIMIT 3');
            console.log(`👥 Users found: ${users.length}`);
          } catch (error) {
            console.log('⚠️  Users table not accessible:', error.message);
          }
        }
      }
      
      await connection.end();
      console.log('\n🎉 Database test completed successfully!');
      return true;
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      if (i === configs.length - 1) {
        console.log('\n💡 Suggestions:');
        console.log('1. Make sure MySQL is running');
        console.log('2. Verify the root password is set to "Jairam123!"');
        console.log('3. Check if PMActivity2 database exists');
        console.log('4. Run the schema creation script first');
      }
    }
  }
  
  return false;
}

// Run the test
testDatabase().catch(console.error);
