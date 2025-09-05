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

// Database test
app.get('/db-test', async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: 'Database connection successful' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'MEMBER' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const connection = await dbPool.getConnection();

    // Generate UUID for user
    const [uuidResult] = await connection.execute('SELECT UUID() as id');
    const userId = uuidResult[0].id;

    await connection.execute(
      'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, name, role]
    );

    connection.release();

    res.status(201).json({
      message: 'User registered successfully',
      userId: userId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Email already exists' });
    } else {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const connection = await dbPool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        organizationId: user.organization_id || null
      },
      process.env.JWT_SECRET || 'super-secret-jwt-key-for-production-2024',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, email, name, role, organization_id FROM users WHERE id = ?', 
      [req.user.userId]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/auth/create-organization', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const connection = await dbPool.getConnection();
    
    // Generate UUID for organization
    const [uuidResult] = await connection.execute('SELECT UUID() as id');
    const orgId = uuidResult[0].id;
    
    await connection.execute(
      'INSERT INTO organizations (id, name, description, created_by) VALUES (?, ?, ?, ?)',
      [orgId, name, description || '', req.user.userId]
    );

    await connection.execute(
      'UPDATE users SET organization_id = ? WHERE id = ?',
      [orgId, req.user.userId]
    );

    connection.release();

    res.status(201).json({
      message: 'Organization created successfully',
      organizationId: orgId
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

app.get('/auth/default-password', authenticateToken, (req, res) => {
  res.json({ defaultPassword: 'Welcome123!' });
});

// ============================================================================
// ORGANIZATION ENDPOINTS
// ============================================================================

app.get('/organization', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    
    // Get user's current organization_id
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userOrgId = userRows[0].organization_id;
    
    if (!userOrgId || userOrgId === '0' || userOrgId === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not associated with any organization' });
    }
    
    const [rows] = await connection.execute(
      'SELECT o.*, u.name as created_by_name FROM organizations o LEFT JOIN users u ON o.created_by = u.id WHERE o.id = ?',
      [userOrgId]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = rows[0];
    res.json({
      id: org.id,
      name: org.name,
      description: org.description,
      createdBy: org.created_by,
      createdByName: org.created_by_name,
      createdAt: org.created_at
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

app.put('/organization', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const connection = await dbPool.getConnection();
    
    // Get user's organization_id
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id) {
      connection.release();
      return res.status(404).json({ error: 'User not associated with any organization' });
    }

    await connection.execute(
      'UPDATE organizations SET name = ?, description = ? WHERE id = ?',
      [name, description || '', userRows[0].organization_id]
    );
    connection.release();

    res.json({ message: 'Organization updated successfully' });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

app.get('/organization/users/count', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    
    // Get user's organization_id
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id || userRows[0].organization_id === '0') {
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

app.get('/organization/users', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    
    // Get user's organization_id
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id || userRows[0].organization_id === '0') {
      connection.release();
      return res.status(404).json({ error: 'User not associated with any organization' });
    }
    
    const [rows] = await connection.execute(
      'SELECT id, email, name, role, created_at FROM users WHERE organization_id = ?',
      [userRows[0].organization_id]
    );
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({ error: 'Failed to fetch organization users' });
  }
});

// ============================================================================
// USER ENDPOINTS
// ============================================================================

app.get('/users', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    
    // Get user's organization_id
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id || userRows[0].organization_id === '0') {
      connection.release();
      return res.status(404).json({ error: 'User not associated with any organization' });
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

// ============================================================================
// STATUS CONFIGURATION ENDPOINTS
// ============================================================================

app.get('/status-configuration', authenticateToken, (req, res) => {
  const defaultStatuses = {
    activity: [
      { id: '1', name: 'TODO', type: 'activity', isActive: true, order: 1, color: '#6B7280' },
      { id: '2', name: 'IN_PROGRESS', type: 'activity', isActive: true, order: 2, color: '#3B82F6' },
      { id: '3', name: 'REVIEW', type: 'activity', isActive: true, order: 3, color: '#F59E0B' },
      { id: '4', name: 'DONE', type: 'activity', isActive: true, order: 4, color: '#10B981' }
    ],
    task: [
      { id: '5', name: 'PENDING', type: 'task', isActive: true, order: 1, color: '#6B7280' },
      { id: '6', name: 'ASSIGNED', type: 'task', isActive: true, order: 2, color: '#3B82F6' },
      { id: '7', name: 'COMPLETED', type: 'task', isActive: true, order: 3, color: '#10B981' }
    ],
    approval: [
      { id: '8', name: 'DRAFT', type: 'approval', isActive: true, order: 1, color: '#6B7280' },
      { id: '9', name: 'SUBMITTED', type: 'approval', isActive: true, order: 2, color: '#F59E0B' },
      { id: '10', name: 'APPROVED', type: 'approval', isActive: true, order: 3, color: '#10B981' },
      { id: '11', name: 'REJECTED', type: 'approval', isActive: true, order: 4, color: '#EF4444' }
    ]
  };

  const { type } = req.query;
  if (type && defaultStatuses[type]) {
    res.json(defaultStatuses[type]);
  } else {
    res.json(defaultStatuses);
  }
});

app.get('/status-configuration/active', authenticateToken, (req, res) => {
  const activeStatuses = [
    { id: '1', name: 'TODO', type: 'activity', isActive: true, order: 1, color: '#6B7280' },
    { id: '2', name: 'IN_PROGRESS', type: 'activity', isActive: true, order: 2, color: '#3B82F6' },
    { id: '3', name: 'REVIEW', type: 'activity', isActive: true, order: 3, color: '#F59E0B' },
    { id: '4', name: 'DONE', type: 'activity', isActive: true, order: 4, color: '#10B981' },
    { id: '5', name: 'PENDING', type: 'task', isActive: true, order: 1, color: '#6B7280' },
    { id: '6', name: 'ASSIGNED', type: 'task', isActive: true, order: 2, color: '#3B82F6' },
    { id: '7', name: 'COMPLETED', type: 'task', isActive: true, order: 3, color: '#10B981' }
  ];

  res.json(activeStatuses);
});

app.get('/status-configuration/mapping', authenticateToken, (req, res) => {
  const statusMapping = {
    activity: {
      'TODO': { next: ['IN_PROGRESS'], color: '#6B7280' },
      'IN_PROGRESS': { next: ['REVIEW', 'DONE'], color: '#3B82F6' },
      'REVIEW': { next: ['TODO', 'DONE'], color: '#F59E0B' },
      'DONE': { next: [], color: '#10B981' }
    },
    task: {
      'PENDING': { next: ['ASSIGNED'], color: '#6B7280' },
      'ASSIGNED': { next: ['COMPLETED'], color: '#3B82F6' },
      'COMPLETED': { next: [], color: '#10B981' }
    }
  };

  res.json(statusMapping);
});

app.post('/status-configuration/validate-transition', authenticateToken, (req, res) => {
  const { fromStatus, toStatus, type } = req.body;

  const validTransitions = {
    activity: {
      'TODO': ['IN_PROGRESS'],
      'IN_PROGRESS': ['REVIEW', 'DONE'],
      'REVIEW': ['TODO', 'DONE'],
      'DONE': []
    },
    task: {
      'PENDING': ['ASSIGNED'],
      'ASSIGNED': ['COMPLETED'],
      'COMPLETED': []
    }
  };

  const isValid = validTransitions[type] && 
                  validTransitions[type][fromStatus] && 
                  validTransitions[type][fromStatus].includes(toStatus);

  res.json({ isValid });
});

// ============================================================================
// PROJECT ENDPOINTS
// ============================================================================

app.get('/projects', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    
    // Get user's organization_id
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id) {
      connection.release();
      return res.json([]);
    }
    
    // For now, return empty array - projects functionality can be added later
    connection.release();
    res.json([]);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

async function initializeDatabase() {
  try {
    dbPool = mysql.createPool(dbConfig);
    
    const connection = await dbPool.getConnection();
    
    // Create users table
    await connection.execute(`
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
    `);

    // Create organizations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_by (created_by)
      )
    `);

    // Create projects table (for future use)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        organization_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36),
        status ENUM('ACTIVE', 'INACTIVE', 'COMPLETED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_organization_id (organization_id),
        INDEX idx_created_by (created_by)
      )
    `);

    connection.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// SERVER STARTUP
// ============================================================================

initializeDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Activity Tracker Backend v2.0.0 running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    console.log('Server is ready to accept connections');
  });
});

// ============================================================================
// GRACEFUL SHUTDOWN & ERROR HANDLING
// ============================================================================

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (dbPool) {
    await dbPool.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (dbPool) {
    await dbPool.end();
  }
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
