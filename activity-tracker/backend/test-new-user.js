const mysql = require('mysql2/promise');

async function testNewUser() {
  console.log('🔍 Testing new pmactivity2_user...');
  
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'pmactivity2_user',
    password: 'pmactivity2_pass',
    database: 'PMActivity2'
  };
  
  try {
    console.log('Connecting to MySQL...');
    const connection = await mysql.createConnection(config);
    
    console.log('✅ Connected successfully!');
    
    // Test basic query
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📁 Available databases:', databases.map(db => Object.values(db)[0]));
    
    // Test PMActivity2 access
    await connection.execute('USE PMActivity2');
    console.log('✅ Successfully switched to PMActivity2 database');
    
    // Check tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Tables in PMActivity2 (${tables.length}):`, tables.map(t => Object.values(t)[0]));
    
    // Check status_configuration data
    const [statusRows] = await connection.execute('SELECT * FROM status_configuration LIMIT 5');
    console.log(`⚙️  Status configurations (showing first 5):`);
    statusRows.forEach(row => {
      console.log(`   - ${row.name} (${row.type}) - ${row.color}`);
    });
    
    await connection.end();
    
    console.log('\n🎉 SUCCESS! The new user works perfectly.');
    console.log('\n📝 Update your .env file with:');
    console.log('DB_HOST=localhost');
    console.log('DB_PORT=3306');
    console.log('DB_USERNAME=pmactivity2_user');
    console.log('DB_PASSWORD=pmactivity2_pass');
    console.log('DB_NAME=PMActivity2');
    
    return true;
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 The user might not exist yet. Please run this SQL in MySQL Workbench:');
      console.log(`
CREATE USER IF NOT EXISTS 'pmactivity2_user'@'localhost' IDENTIFIED BY 'pmactivity2_pass';
GRANT ALL PRIVILEGES ON PMActivity2.* TO 'pmactivity2_user'@'localhost';
FLUSH PRIVILEGES;
      `);
    }
    
    return false;
  }
}

testNewUser().catch(console.error);
