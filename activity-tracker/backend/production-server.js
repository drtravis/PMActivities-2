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

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Initialize database
async function initDatabase() {
  try {
    dbPool = mysql.createPool(dbConfig);
    console.log('Database pool created successfully');

    const connection = await dbPool.getConnection();
    console.log('Database connection successful');

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'PROJECT_MANAGER', 'MEMBER') DEFAULT 'MEMBER',
        organization_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add organization_id column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN organization_id VARCHAR(36) NULL
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        console.log('Note: organization_id column already exists or other error:', error.message);
      }
    }

    // Organizations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS organizations (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Projects table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        organization_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36),
        status ENUM('ACTIVE', 'COMPLETED', 'ON_HOLD') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Activities table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_id VARCHAR(36) NOT NULL,
        assigned_to VARCHAR(36),
        status ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE') DEFAULT 'TODO',
        priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
        due_date DATE,
        created_by VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    connection.release();
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

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
    const [rows] = await connection.execute('SELECT 1 as test');
    connection.release();
    
    res.json({
      status: 'Database connected',
      result: rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Auth endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, role = 'MEMBER' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await dbPool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );
    connection.release();

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Email already exists' });
    } else {
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
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
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
        organizationId: user.organization_id
      },
      process.env.JWT_SECRET || 'your-secret-key',
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

app.post('/auth/create-organization', authenticateToken, async (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const connection = await dbPool.getConnection();
    
    const [orgResult] = await connection.execute(
      'INSERT INTO organizations (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, req.user.userId]
    );

    await connection.execute(
      'UPDATE users SET organization_id = ? WHERE id = ?',
      [orgResult.insertId, req.user.userId]
    );

    connection.release();

    res.status(201).json({
      message: 'Organization created successfully',
      organizationId: orgResult.insertId
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Organization endpoints
app.get('/organization', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [rows] = await connection.execute(
      'SELECT o.*, u.name as created_by_name FROM organizations o LEFT JOIN users u ON o.created_by = u.id WHERE o.id = ?',
      [req.user.organizationId]
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
      createdAt: org.created_at,
      updatedAt: org.updated_at
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
    await connection.execute(
      'UPDATE organizations SET name = ?, description = ? WHERE id = ?',
      [name, description || '', req.user.organizationId]
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
    const [rows] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = ?',
      [req.user.organizationId]
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
    const [rows] = await connection.execute(
      'SELECT id, email, name, role, created_at FROM users WHERE organization_id = ?',
      [req.user.organizationId]
    );
    connection.release();

    res.json(rows.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.created_at
    })));
  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({ error: 'Failed to fetch organization users' });
  }
});

// Status Configuration endpoints
app.get('/status-configuration', authenticateToken, (req, res) => {
  try {
    const { type } = req.query;
    
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

    if (type && defaultStatuses[type]) {
      res.json(defaultStatuses[type]);
    } else {
      res.json(Object.values(defaultStatuses).flat());
    }
  } catch (error) {
    console.error('Status configuration error:', error);
    res.status(500).json({ error: 'Failed to fetch status configurations' });
  }
});

app.get('/status-configuration/active', authenticateToken, (req, res) => {
  try {
    const { type } = req.query;
    
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

    if (type && defaultStatuses[type]) {
      res.json(defaultStatuses[type]);
    } else {
      res.json(Object.values(defaultStatuses).flat());
    }
  } catch (error) {
    console.error('Active status configuration error:', error);
    res.status(500).json({ error: 'Failed to fetch active status configurations' });
  }
});

app.get('/status-configuration/mapping', authenticateToken, (req, res) => {
  try {
    const mapping = {
      activity: {
        'TODO': { label: 'To Do', color: '#6B7280', order: 1 },
        'IN_PROGRESS': { label: 'In Progress', color: '#3B82F6', order: 2 },
        'REVIEW': { label: 'Review', color: '#F59E0B', order: 3 },
        'DONE': { label: 'Done', color: '#10B981', order: 4 }
      },
      task: {
        'PENDING': { label: 'Pending', color: '#6B7280', order: 1 },
        'ASSIGNED': { label: 'Assigned', color: '#3B82F6', order: 2 },
        'COMPLETED': { label: 'Completed', color: '#10B981', order: 3 }
      },
      approval: {
        'DRAFT': { label: 'Draft', color: '#6B7280', order: 1 },
        'SUBMITTED': { label: 'Submitted', color: '#F59E0B', order: 2 },
        'APPROVED': { label: 'Approved', color: '#10B981', order: 3 },
        'REJECTED': { label: 'Rejected', color: '#EF4444', order: 4 }
      }
    };

    res.json(mapping);
  } catch (error) {
    console.error('Status mapping error:', error);
    res.status(500).json({ error: 'Failed to fetch status mapping' });
  }
});

app.post('/status-configuration/validate-transition', authenticateToken, (req, res) => {
  try {
    const { type, fromStatus, toStatus } = req.body;
    const isValid = true; // Allow all transitions for now
    res.json({ isValid });
  } catch (error) {
    console.error('Status transition validation error:', error);
    res.status(500).json({ error: 'Failed to validate status transition' });
  }
});

// Activities endpoints
app.get('/activities', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [rows] = await connection.execute(`
      SELECT a.*, u.name as assigned_name, p.name as project_name 
      FROM activities a 
      LEFT JOIN users u ON a.assigned_to = u.id 
      LEFT JOIN projects p ON a.project_id = p.id
      ORDER BY a.created_at DESC
    `);
    connection.release();

    res.json({
      activities: rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        dueDate: row.due_date,
        projectId: row.project_id,
        projectName: row.project_name,
        assignedTo: row.assigned_to,
        assignedName: row.assigned_name,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (error) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  try {
    await initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Activity Tracker API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
      console.log('Server is ready to accept connections');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
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

startServer();
