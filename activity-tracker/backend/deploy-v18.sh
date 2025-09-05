#!/bin/bash

# Deploy complete backend server v18 to Azure Container Apps

echo "Updating Activity Tracker Backend to v2.0.0..."

az containerapp update \
  --name activity-tracker-backend \
  --resource-group activity-tracker-rg \
  --container-name activity-tracker-backend \
  --image node:18-alpine \
  --command "sh" \
  --args "-c,cd /app && cat > package.json << 'PACKAGE_EOF'
{
  \"name\": \"activity-tracker-backend\",
  \"version\": \"2.0.0\",
  \"main\": \"server.js\",
  \"dependencies\": {
    \"express\": \"^4.18.2\",
    \"mysql2\": \"^3.6.0\",
    \"jsonwebtoken\": \"^9.0.2\",
    \"bcrypt\": \"^5.1.0\"
  }
}
PACKAGE_EOF
cat > server.js << 'SERVER_EOF'
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'PMActivity2',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

let dbPool;

// Basic middleware
app.use(express.json());

// Enhanced CORS
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'super-secret-jwt-key-for-production-2024', (err, user) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Activity Tracker Backend API', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Status configuration endpoints
app.get('/status-configuration/active', authenticateToken, (req, res) => {
  const activeStatuses = [
    { id: '1', name: 'TODO', type: 'activity', isActive: true, order: 1, color: '#6B7280' },
    { id: '2', name: 'IN_PROGRESS', type: 'activity', isActive: true, order: 2, color: '#3B82F6' },
    { id: '3', name: 'REVIEW', type: 'activity', isActive: true, order: 3, color: '#F59E0B' },
    { id: '4', name: 'DONE', type: 'activity', isActive: true, order: 4, color: '#10B981' }
  ];
  res.json(activeStatuses);
});

app.get('/auth/default-password', authenticateToken, (req, res) => {
  res.json({ defaultPassword: 'Welcome123!' });
});

app.get('/organization/users/count', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id) {
      connection.release();
      return res.status(404).json({ error: 'User not associated with any organization' });
    }
    
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = ?',
      [userRows[0].organization_id]
    );
    connection.release();

    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Get user count error:', error);
    res.status(500).json({ error: 'Failed to fetch user count' });
  }
});

app.get('/users', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id) {
      connection.release();
      return res.json([]);
    }
    
    const [rows] = await connection.execute(
      'SELECT id, email, name, role, created_at FROM users WHERE organization_id = ?',
      [userRows[0].organization_id]
    );
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Initialize database
async function initializeDatabase() {
  try {
    dbPool = mysql.createPool(dbConfig);
    const connection = await dbPool.getConnection();
    
    // Create users table
    await connection.execute(\`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'PROJECT_MANAGER', 'MEMBER') DEFAULT 'MEMBER',
        organization_id VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_organization_id (organization_id),
        INDEX idx_email (email)
      )
    \`);

    // Create organizations table
    await connection.execute(\`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_by (created_by)
      )
    \`);

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Start server
initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log('Activity Tracker Backend v2.0.0 running on port', PORT);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Server is ready to accept connections');
  });
});
SERVER_EOF
npm install && node server.js"

echo "Deployment command completed. Waiting for container to restart..."
