const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing MySQL connection...');
  
  const configs = [
    {
      name: 'Root with Jairam123!',
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'Jairam123!'
    },
    {
      name: 'Root with empty password',
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    },
    {
      name: 'Root with root password',
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root'
    }
  ];

  for (const config of configs) {
    try {
      console.log(`\nTrying ${config.name}...`);
      const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        connectTimeout: 5000
      });
      
      console.log(`✅ Connected successfully with ${config.name}`);
      
      // Try to show databases
      const [rows] = await connection.execute('SHOW DATABASES');
      console.log('Available databases:', rows.map(row => row.Database));
      
      // Try to create PMActivity2 database
      await connection.execute('CREATE DATABASE IF NOT EXISTS PMActivity2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ PMActivity2 database created/verified');
      
      await connection.end();
      
      // Update .env file with working credentials
      console.log(`\n🎯 Working credentials found! Update your .env file:`);
      console.log(`DB_USERNAME=${config.user}`);
      console.log(`DB_PASSWORD=${config.password}`);
      
      break;
      
    } catch (error) {
      console.log(`❌ Failed with ${config.name}: ${error.message}`);
    }
  }
}

testConnection().catch(console.error);
