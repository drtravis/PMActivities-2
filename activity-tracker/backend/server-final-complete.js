const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'activity_tracker',
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
    version: '3.0.0-complete'
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
    const [result] = await connection.execute('SELECT 1 as test');
    connection.release();
    res.json({ 
      status: 'Database connected', 
      result: result[0],
      timestamp: new Date().toISOString()
    });
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
      logo: org.logo,
      industry: org.industry,
      size: org.size,
      timezone: org.timezone,
      currency: org.currency,
      settings: org.settings ? (typeof org.settings === 'string' ? JSON.parse(org.settings) : org.settings) : null,
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
    console.log('PUT /organization request body:', req.body);
    const { name, description, logo, industry, size, timezone, currency, settings } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

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

    const userOrgId = userRows[0].organization_id;
    console.log('Updating organization ID:', userOrgId, 'with data:', { name, description, logo, industry, size, timezone, currency });
    
    // Add missing columns if they don't exist
    const columnsToAdd = [
      'logo TEXT',
      'industry VARCHAR(255)',
      'size VARCHAR(50)',
      'timezone VARCHAR(100)',
      'currency VARCHAR(10)',
      'settings JSON'
    ];
    
    for (const column of columnsToAdd) {
      try {
        const [columnName] = column.split(' ');
        await connection.execute(`ALTER TABLE organizations ADD COLUMN ${column}`);
        console.log(`Added ${columnName} column to organizations table`);
      } catch (err) {
        // Column probably already exists, ignore error
      }
    }
    
    // Update organization with all fields
    const [updateResult] = await connection.execute(
      'UPDATE organizations SET name = ?, description = ?, logo = ?, industry = ?, size = ?, timezone = ?, currency = ?, settings = ? WHERE id = ?',
      [
        name, 
        description || '', 
        logo || null, 
        industry || null, 
        size || null, 
        timezone || null, 
        currency || null, 
        settings ? JSON.stringify(settings) : null, 
        userOrgId
      ]
    );
    
    console.log('Update result:', updateResult);
    
    // Get updated organization
    const [rows] = await connection.execute(
      'SELECT o.*, u.name as created_by_name FROM organizations o LEFT JOIN users u ON o.created_by = u.id WHERE o.id = ?',
      [userOrgId]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = rows[0];
    console.log('Updated organization:', org);
    
    res.json({
      id: org.id,
      name: org.name,
      description: org.description,
      logo: org.logo,
      industry: org.industry,
      size: org.size,
      timezone: org.timezone,
      currency: org.currency,
      settings: org.settings ? (typeof org.settings === 'string' ? JSON.parse(org.settings) : org.settings) : null,
      createdBy: org.created_by,
      createdByName: org.created_by_name,
      createdAt: org.created_at
    });
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
      return res.json({ count: 0 });
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

// User creation endpoint
app.post('/users', authenticateToken, async (req, res) => {
  try {
    const { email, name, role = 'MEMBER', password } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const connection = await dbPool.getConnection();
    
    // Get admin user's organization_id
    const [adminRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (adminRows.length === 0 || !adminRows[0].organization_id) {
      connection.release();
      return res.status(400).json({ error: 'Admin user not associated with any organization' });
    }

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      connection.release();
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate UUID for user
    const [uuidResult] = await connection.execute('SELECT UUID() as id');
    const userId = uuidResult[0].id;
    
    // Create user
    await connection.execute(
      'INSERT INTO users (id, email, password, name, role, organization_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, name, role, adminRows[0].organization_id]
    );
    
    connection.release();
    
    res.status(201).json({
      message: 'User created successfully',
      userId: userId,
      user: {
        id: userId,
        email: email,
        name: name,
        role: role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ============================================================================
// STATUS CONFIGURATION ENDPOINTS
// ============================================================================

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
    'TODO': { nextStates: ['IN_PROGRESS'], color: '#6B7280' },
    'IN_PROGRESS': { nextStates: ['REVIEW', 'DONE'], color: '#3B82F6' },
    'REVIEW': { nextStates: ['IN_PROGRESS', 'DONE'], color: '#F59E0B' },
    'DONE': { nextStates: [], color: '#10B981' },
    'PENDING': { nextStates: ['ASSIGNED'], color: '#6B7280' },
    'ASSIGNED': { nextStates: ['COMPLETED'], color: '#3B82F6' },
    'COMPLETED': { nextStates: [], color: '#10B981' }
  };

  res.json(statusMapping);
});

// Add base status-configuration endpoint
app.get('/status-configuration', authenticateToken, (req, res) => {
  res.json({
    message: 'Status Configuration API',
    endpoints: [
      '/status-configuration/active',
      '/status-configuration/mapping'
    ]
  });
});

// ============================================================================
// LOGO UPLOAD ENDPOINTS
// ============================================================================

// Configure multer for logo uploads
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'logos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `logo-${timestamp}${ext}`;
    cb(null, filename);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(jpg|jpeg|png|gif|svg|webp)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// POST /organization/logo - Upload organization logo
app.post('/organization/logo', authenticateToken, logoUpload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
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
    
    const userOrgId = userRows[0].organization_id;
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    // Update organization with logo URL
    await connection.execute(
      'UPDATE organizations SET logo = ? WHERE id = ?',
      [logoUrl, userOrgId]
    );
    
    connection.release();
    
    res.json({
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// GET /uploads/logos/:filename - Serve logo files
app.get('/uploads/logos/:filename', (req, res) => {
  const filename = req.params.filename;
  const logoPath = path.join(__dirname, 'uploads', 'logos', filename);
  
  if (fs.existsSync(logoPath)) {
    res.sendFile(logoPath);
  } else {
    res.status(404).json({ error: 'Logo not found' });
  }
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
    
    // Get projects for user's organization
    const [projects] = await connection.execute(
      'SELECT p.*, u.name as created_by_name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.organization_id = ? ORDER BY p.created_at DESC',
      [userRows[0].organization_id]
    );
    
    connection.release();
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/projects', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const connection = await dbPool.getConnection();
    
    // Get user's organization_id
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id) {
      connection.release();
      return res.status(400).json({ error: 'User not associated with any organization' });
    }

    // Generate UUID for project
    const [uuidResult] = await connection.execute('SELECT UUID() as id');
    const projectId = uuidResult[0].id;
    
    // Create projects table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        organization_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    
    await connection.execute(
      'INSERT INTO projects (id, name, description, organization_id, created_by) VALUES (?, ?, ?, ?, ?)',
      [projectId, name, description || '', userRows[0].organization_id, req.user.userId]
    );
    
    connection.release();

    res.status(201).json({
      message: 'Project created successfully',
      projectId: projectId
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Project member management endpoints
app.post('/projects/:projectId/members', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const connection = await dbPool.getConnection();
    
    // Create project_members table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS project_members (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        project_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        role VARCHAR(50) DEFAULT 'MEMBER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_project_user (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add user to project
    await connection.execute(
      'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
      [projectId, userId]
    );
    
    connection.release();
    
    res.status(201).json({
      message: 'User added to project successfully',
      projectId: projectId,
      userId: userId
    });
  } catch (error) {
    console.error('Add project member error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'User is already a member of this project' });
    } else {
      res.status(500).json({ error: 'Failed to add user to project' });
    }
  }
});

app.get('/projects/:projectId/members', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const connection = await dbPool.getConnection();
    
    const [members] = await connection.execute(`
      SELECT u.id, u.email, u.name, u.role, pm.role as project_role, pm.created_at as joined_at
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.created_at DESC
    `, [projectId]);
    
    connection.release();
    res.json(members);
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ error: 'Failed to fetch project members' });
  }
});

app.delete('/projects/:projectId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const connection = await dbPool.getConnection();
    
    await connection.execute(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    
    connection.release();
    
    res.json({
      message: 'User removed from project successfully'
    });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({ error: 'Failed to remove user from project' });
  }
});

// User project assignment endpoints
app.post('/users/:userId/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const connection = await dbPool.getConnection();
    
    // Create project_members table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS project_members (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        project_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        role VARCHAR(50) DEFAULT 'MEMBER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_project_user (project_id, user_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Add user to project
    await connection.execute(
      'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
      [projectId, userId]
    );
    
    connection.release();
    
    res.status(201).json({
      message: 'User assigned to project successfully',
      userId: userId,
      projectId: projectId
    });
  } catch (error) {
    console.error('Assign user to project error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'User is already assigned to this project' });
    } else {
      res.status(500).json({ error: 'Failed to assign user to project' });
    }
  }
});

app.delete('/users/:userId/projects/:projectId', authenticateToken, async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const connection = await dbPool.getConnection();
    
    await connection.execute(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    
    connection.release();
    
    res.json({
      message: 'User removed from project successfully'
    });
  } catch (error) {
    console.error('Remove user from project error:', error);
    res.status(500).json({ error: 'Failed to remove user from project' });
  }
});

// User role management endpoint
app.patch('/users/:userId/role', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!role || !['ADMIN', 'PROJECT_MANAGER', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (ADMIN, PROJECT_MANAGER, MEMBER)' });
    }

    const connection = await dbPool.getConnection();
    
    // Update user role
    const [result] = await connection.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );
    
    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get updated user
    const [userRows] = await connection.execute(
      'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    connection.release();
    
    res.json({
      message: 'User role updated successfully',
      user: userRows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ============================================================================
// ACTIVITY ENDPOINTS
// ============================================================================

app.get('/activities', authenticateToken, async (req, res) => {
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
    
    // Get activities for user's organization
    const [activities] = await connection.execute(`
      SELECT a.*, p.name as project_name, u.name as created_by_name
      FROM activities a
      LEFT JOIN projects p ON a.project_id = p.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.organization_id = ?
      ORDER BY a.created_at DESC
    `, [userRows[0].organization_id]);
    
    connection.release();
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

app.post('/activities', authenticateToken, async (req, res) => {
  try {
    const { title, description, projectId, assigneeId, priority = 'MEDIUM', dueDate } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Activity title is required' });
    }

    const connection = await dbPool.getConnection();
    
    // Get user's organization_id
    const [userRows] = await connection.execute(
      'SELECT organization_id FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (userRows.length === 0 || !userRows[0].organization_id) {
      connection.release();
      return res.status(400).json({ error: 'User not associated with any organization' });
    }

    // Create activities table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        project_id VARCHAR(36),
        organization_id VARCHAR(36) NOT NULL,
        created_by VARCHAR(36) NOT NULL,
        assignee_id VARCHAR(36),
        status VARCHAR(50) DEFAULT 'TODO',
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (assignee_id) REFERENCES users(id)
      )
    `);
    
    // Generate UUID for activity
    const [uuidResult] = await connection.execute('SELECT UUID() as id');
    const activityId = uuidResult[0].id;
    
    // Create activity
    await connection.execute(
      'INSERT INTO activities (id, title, description, project_id, organization_id, created_by, assignee_id, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [activityId, title, description || '', projectId || null, userRows[0].organization_id, req.user.userId, assigneeId || null, priority, dueDate || null]
    );
    
    connection.release();

    res.status(201).json({
      message: 'Activity created successfully',
      activityId: activityId
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity' });
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

    // Create projects table
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
    console.log(`Activity Tracker Backend v3.0.0-complete running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    console.log('All endpoints available including missing ones');
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
