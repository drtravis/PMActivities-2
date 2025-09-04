const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
    const connectionConfig = {
        host: 'pactivities-db.mysql.database.azure.com',
        port: 3306,
        user: 'travisai',
        password: 'Haritha#12',
        database: 'pactivities',
        ssl: {
            rejectUnauthorized: false
        }
    };

    console.log('🔍 Testing Azure MySQL Database Connection...');
    console.log('📍 Host:', connectionConfig.host);
    console.log('👤 User:', connectionConfig.user);
    console.log('🗄️  Database:', connectionConfig.database);
    console.log('');

    try {
        console.log('⏳ Attempting to connect...');
        const connection = await mysql.createConnection(connectionConfig);
        
        console.log('✅ Connection successful!');
        
        // Test basic query
        console.log('⏳ Testing basic query...');
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Query successful:', rows);
        
        // Check database info
        console.log('⏳ Getting database info...');
        const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db, VERSION() as version');
        console.log('✅ Database Info:', dbInfo[0]);
        
        // List tables
        console.log('⏳ Checking existing tables...');
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('📋 Tables in database:', tables.length > 0 ? tables : 'No tables found');
        
        await connection.end();
        console.log('');
        console.log('🎉 Database is running and accessible!');
        
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 'ENOTFOUND') {
            console.log('💡 Suggestion: Check if the database server name is correct');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 Suggestion: Check username and password');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('💡 Suggestion: Check if database is running and firewall allows connections');
        }
    }
}

// Run the test
testDatabaseConnection();
