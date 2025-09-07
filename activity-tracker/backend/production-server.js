const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PORT = process.env.PORT || 3001;

// Database configuration
const useSsl = (process.env.DB_SSL ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'pmactivity2',
  // MySQL2 pool configuration
  connectionLimit: 10,
  queueLimit: 0,
  // Azure Database for MySQL requires SSL by default
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
};

let dbPool;

// Middleware
app.use((req, res, next) => {
  const corsEnv = process.env.CORS_ORIGIN || 'http://localhost:3000';

  if (corsEnv === '*') {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (corsEnv.includes(',')) {
    const origins = corsEnv.split(',').map(o => o.trim());
    const requestOrigin = req.headers.origin;
    if (requestOrigin && origins.includes(requestOrigin)) {
      res.header('Access-Control-Allow-Origin', requestOrigin);
    } else {
      res.header('Access-Control-Allow-Origin', origins[0] || 'http://localhost:3000');
    }
  } else {
    res.header('Access-Control-Allow-Origin', corsEnv);
  }

  // Allow all HTTP methods used by the frontend, including PATCH
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
// Configure multer for task attachments
const taskAttachmentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'task_attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'attachment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadTaskAttachment = multer({
  storage: taskAttachmentStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});


// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
// Helper: record task activity
async function recordTaskActivity(connection, { taskId, action, field = null, oldValue = null, newValue = null, performedBy }) {
  try {
    await connection.execute(`
      INSERT INTO task_activities (id, task_id, action, field, old_value, new_value, performed_by, created_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())
    `, [taskId, action, field, oldValue, newValue, performedBy]);
  } catch (e) {
    console.error('Failed to record task activity:', e.message);
  }
}

};

// Database query with timeout wrapper
async function executeWithTimeout(connection, query, params = [], timeoutMs = 10000) {
  return Promise.race([
    connection.execute(query, params),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ]);
}

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
        logo_path VARCHAR(500),
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
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        owner_id VARCHAR(36),
        organization_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (owner_id) REFERENCES users(id)
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

    // Add logo_path column to organizations table if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE organizations ADD COLUMN logo_path VARCHAR(500)
      `);
      console.log('Added logo_path column to organizations table');
    } catch (error) {
      // Column might already exist, ignore the error
      if (!error.message.includes('Duplicate column name')) {
        console.log('logo_path column might already exist:', error.message);
      }
    }

    // Migrate projects table to new schema
    try {
      // Check if projects table has old schema and migrate
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'projects'
      `);

      const columnNames = columns.map(col => col.COLUMN_NAME);

      // Add missing columns if they don't exist
      if (!columnNames.includes('owner_id')) {
        await connection.execute(`ALTER TABLE projects ADD COLUMN owner_id VARCHAR(36)`);
        console.log('Added owner_id column to projects table');
      }

      if (!columnNames.includes('start_date')) {
        await connection.execute(`ALTER TABLE projects ADD COLUMN start_date DATE`);
        console.log('Added start_date column to projects table');
      }

      if (!columnNames.includes('end_date')) {
        await connection.execute(`ALTER TABLE projects ADD COLUMN end_date DATE`);
        console.log('Added end_date column to projects table');
      }

      // Update status column type if needed
      if (columnNames.includes('status')) {
        await connection.execute(`ALTER TABLE projects MODIFY COLUMN status VARCHAR(50) DEFAULT 'active'`);
        console.log('Updated status column in projects table');
      }

      // Copy created_by to owner_id if owner_id is empty and created_by exists
      if (columnNames.includes('created_by') && columnNames.includes('owner_id')) {
        await connection.execute(`UPDATE projects SET owner_id = created_by WHERE owner_id IS NULL AND created_by IS NOT NULL`);
        console.log('Migrated created_by to owner_id in projects table');
      }

    } catch (error) {
      console.error('Error migrating projects table:', error.message);
    }

    // Add missing columns to users table for invitation functionality
    try {
      const [userColumns] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
      `);

      const userColumnNames = userColumns.map(col => col.COLUMN_NAME);

      if (!userColumnNames.includes('is_active')) {
        await connection.execute(`ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE`);
        console.log('Added is_active column to users table');
      }

      if (!userColumnNames.includes('invitation_token')) {
        await connection.execute(`ALTER TABLE users ADD COLUMN invitation_token VARCHAR(255)`);
        console.log('Added invitation_token column to users table');
      }

      if (!userColumnNames.includes('invitation_expires_at')) {
        await connection.execute(`ALTER TABLE users ADD COLUMN invitation_expires_at TIMESTAMP`);
        console.log('Added invitation_expires_at column to users table');
      }

      // Update existing users to be active by default
      await connection.execute(`UPDATE users SET is_active = TRUE WHERE is_active IS NULL`);

      // Update role enum to include PMO if not already present
      try {
        await connection.execute(`
          ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','PROJECT_MANAGER','MEMBER','PMO') DEFAULT 'MEMBER'
        `);
        console.log('Updated role enum to include PMO');
      } catch (error) {
        console.log('Role enum already includes PMO or error updating:', error.message);
      }

    } catch (error) {
      console.error('Error migrating users table:', error.message);
    }

    // Create project_members table for project assignments
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS project_members (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          project_id VARCHAR(36) NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          role VARCHAR(50) DEFAULT 'MEMBER',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_project_user (project_id, user_id)
        )
      `);
      console.log('Created project_members table');
    } catch (error) {
      console.error('Error creating project_members table:', error.message);
    }

    // Create tasks table for task management
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'assigned',
          priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
          assignee_id VARCHAR(36),
          created_by VARCHAR(36) NOT NULL,
          project_id VARCHAR(36) NOT NULL,
          organization_id VARCHAR(36) NOT NULL,
          due_date DATE,
          completed_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
          INDEX idx_assignee (assignee_id),
          INDEX idx_status (status),
          INDEX idx_priority (priority),
          INDEX idx_due_date (due_date),
          INDEX idx_project (project_id),
          INDEX idx_organization (organization_id)
        )
      `);
      console.log('Created tasks table');

      // Create task_activities table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS task_activities (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          task_id VARCHAR(36) NOT NULL,
          action VARCHAR(50) NOT NULL,
          field VARCHAR(50) NULL,
          old_value TEXT NULL,
          new_value TEXT NULL,
          performed_by VARCHAR(36) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          INDEX idx_task (task_id),
          INDEX idx_action (action)
        )
      `);
      console.log('Created task_activities table');

      // Create task_attachments table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS task_attachments (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          task_id VARCHAR(36) NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          size BIGINT NOT NULL,
          uploaded_by VARCHAR(36) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          INDEX idx_task (task_id)
        )
      `);
      console.log('Created task_attachments table');

      // Create task_comments table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS task_comments (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          task_id VARCHAR(36) NOT NULL,
          author_id VARCHAR(36) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_task (task_id),
          INDEX idx_author (author_id),
          INDEX idx_created_at (created_at)
        )
      `);
      console.log('Created task_comments table');

    } catch (error) {
      console.error('Error creating tasks table:', error.message);
    }

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
    environment: process.env.NODE_ENV || 'development',
    version: '2025-09-07-comments-nocache-fix'
  });
});

// Test endpoint for comments (no auth required)
app.get('/test-comments', (req, res) => {
  res.json({
    message: 'Comments endpoints are available',
    endpoints: [
      'GET /api/tasks/:id/comments',
      'POST /api/tasks/:id/comments'
    ],
    version: '2025-09-07-comments-fix'
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
app.post('/api/auth/register', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
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
        sub: user.id,
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

// Add missing default-password endpoint
app.get('/api/auth/default-password', authenticateToken, async (req, res) => {
  try {
    // Only admins and project managers can get default password
    if (req.user.role !== 'ADMIN' && req.user.role !== 'PROJECT_MANAGER') {
      return res.status(403).json({ error: 'Only administrators and project managers can access default password' });
    }

    res.json({ password: 'Password123!' });
  } catch (error) {
    console.error('Get default password error:', error);
    res.status(500).json({ error: 'Failed to get default password' });
  }
});

app.post('/api/auth/invite', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { email, name, role, projectIds } = req.body;

    // Enhanced debug logging
    console.log('=== INVITE USER REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User from token:', JSON.stringify(req.user, null, 2));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    if (!email || !name || !role) {
      console.log('❌ Missing required fields:', { email: !!email, name: !!name, role: !!role });
      return res.status(400).json({ error: 'Email, name, and role are required' });
    }

    // Only admins and project managers can invite users
    if (req.user.role !== 'ADMIN' && req.user.role !== 'PROJECT_MANAGER') {
      console.log('Permission denied. User role:', req.user.role);
      return res.status(403).json({ error: 'Only administrators and project managers can invite users' });
    }

    connection = await dbPool.getConnection();

    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate UUID for the user
    const [uuidResult] = await connection.execute('SELECT UUID() as id');
    const userId = uuidResult[0].id;

    // Use default password for simplicity
    const defaultPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Map frontend roles to backend roles
    const roleMapping = {
      'project_manager': 'PROJECT_MANAGER',
      'member': 'MEMBER',
      'pmo': 'PMO',
      'admin': 'ADMIN'
    };
    const mappedRole = roleMapping[role] || 'MEMBER';

    // Create the user
    const [result] = await connection.execute(`
      INSERT INTO users (id, email, name, password, role, organization_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, name, hashedPassword, mappedRole, req.user.organizationId, true]);

    // If projectIds are provided, assign user to projects
    if (projectIds && projectIds.length > 0) {
      for (const projectId of projectIds) {
        try {
          await connection.execute(`
            INSERT INTO project_members (project_id, user_id, role)
            VALUES (?, ?, ?)
          `, [projectId, userId, mappedRole]);
        } catch (error) {
          console.warn(`Failed to assign user to project ${projectId}:`, error.message);
        }
      }
    }

    // Get the created user
    const [userRows] = await connection.execute(
      'SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?',
      [userId]
    );

    const createdUser = userRows[0];

    res.status(201).json({
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
      isActive: createdUser.is_active,
      createdAt: createdUser.created_at
    });

  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      error: 'Failed to invite user',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/auth/accept-invitation', async (req, res) => {
  let connection;
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    connection = await dbPool.getConnection();

    // Find user by invitation token
    const [userRows] = await connection.execute(
      'SELECT * FROM users WHERE invitation_token = ? AND invitation_expires_at > NOW()',
      [token]
    );

    if (userRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    const user = userRows[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user with new password and clear invitation token
    await connection.execute(`
      UPDATE users
      SET password = ?, invitation_token = NULL, invitation_expires_at = NULL, is_active = 1
      WHERE id = ?
    `, [hashedPassword, user.id]);

    // Generate JWT token
    const token_payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    };

    const access_token = jwt.sign(token_payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });

    res.json({
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id
      }
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      error: 'Failed to accept invitation',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/auth/create-organization', async (req, res) => {
  try {
    const { organizationName, adminEmail, adminName, adminPassword } = req.body;

    if (!organizationName || !adminEmail || !adminName || !adminPassword) {
      return res.status(400).json({
        error: 'Organization name, admin email, admin name, and admin password are required'
      });
    }

    const connection = await dbPool.getConnection();

    try {
      // Check if organization already exists
      const [existingOrg] = await connection.execute(
        'SELECT id FROM organizations WHERE name = ?',
        [organizationName]
      );

      if (existingOrg.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'Organization with this name already exists' });
      }

      // Check if admin user already exists
      const [existingUser] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [adminEmail]
      );

      if (existingUser.length > 0) {
        connection.release();
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Generate UUID for user and organization
      const [userUuidResult] = await connection.execute('SELECT UUID() as id');
      const userId = userUuidResult[0].id;
      const [orgUuidResult] = await connection.execute('SELECT UUID() as id');
      const orgId = orgUuidResult[0].id;

      // Create organization first (without created_by to avoid foreign key constraint)
      await connection.execute(
        'INSERT INTO organizations (id, name, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [orgId, organizationName]
      );

      // Create admin user with organization_id
      await connection.execute(
        'INSERT INTO users (id, email, name, password, role, organization_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [userId, adminEmail, adminName, hashedPassword, 'ADMIN', orgId]
      );

      // Update organization with created_by now that user exists
      await connection.execute(
        'UPDATE organizations SET created_by = ? WHERE id = ?',
        [userId, orgId]
      );

      connection.release();

      // Generate JWT token for auto-login
      const payload = {
        email: adminEmail,
        sub: userId,
        organizationId: orgId,
        role: 'ADMIN'
      };
      const access_token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });

      res.status(201).json({
        organization: { id: orgId, name: organizationName },
        user: { id: userId, email: adminEmail, name: adminName, role: 'ADMIN', organizationId: orgId },
        access_token
      });
    } catch (dbError) {
      connection.release();
      console.error('Database error in create-organization:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization', details: error.message });
  }
});

// Organization endpoints
app.get('/api/organization', authenticateToken, async (req, res) => {
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
      logoUrl: org.logo_path ? `/uploads/logos/${org.logo_path}` : null,
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

app.put('/api/organization', authenticateToken, async (req, res) => {
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

app.get('/api/organization/users/count', authenticateToken, async (req, res) => {
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

app.get('/api/organization/users', authenticateToken, async (req, res) => {
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
    res.status(200).json([]);
  }
});

// Status Configuration endpoints
app.get('/api/status-configuration', authenticateToken, (req, res) => {
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

app.get('/api/status-configuration/active', authenticateToken, (req, res) => {
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

app.get('/api/status-configuration/mapping', authenticateToken, (req, res) => {
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

app.post('/api/status-configuration/validate-transition', authenticateToken, (req, res) => {
  try {
    const { type, fromStatus, toStatus } = req.body;
    const isValid = true; // Allow all transitions for now
    res.json({ isValid });
  } catch (error) {
    console.error('Status transition validation error:', error);
    res.status(500).json({ error: 'Failed to validate status transition' });
  }
});

// Users endpoints
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [rows] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, u.updated_at,
             o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.organization_id = ?
      ORDER BY u.created_at DESC
    `, [req.user.organizationId]);
    connection.release();

    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [rows] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role, u.created_at, u.updated_at,
             o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = ?
    `, [req.user.sub]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Activities endpoints
app.get('/api/activities', authenticateToken, async (req, res) => {
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

// Tasks endpoints
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { assigneeId } = req.query;
    const connection = await dbPool.getConnection();

    let query = `
      SELECT t.*,
             u.name as assignee_name, u.email as assignee_email,
             creator.name as created_by_name, creator.email as created_by_email,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.organization_id = ?
    `;

    const params = [req.user.organizationId];

    if (assigneeId) {
      query += ' AND t.assignee_id = ?';
      params.push(assigneeId);
    }

    query += ' ORDER BY t.created_at DESC';

    const [rows] = await connection.execute(query, params);
    connection.release();

    const tasks = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      assigneeId: row.assignee_id,
      assignee: row.assignee_name ? {
        id: row.assignee_id,
        name: row.assignee_name,
        email: row.assignee_email
      } : null,
      createdBy: row.created_by_name ? {
        id: row.created_by,
        name: row.created_by_name,
        email: row.created_by_email
      } : null,
      project: row.project_name ? {
        id: row.project_id,
        name: row.project_name
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(200).json([]);
  }
});

app.get('/api/tasks/my', authenticateToken, async (req, res) => {
  try {
    if (!req.user.sub || !req.user.organizationId) {
      return res.status(400).json({ error: 'Invalid token: missing user ID or organization ID' });
    }

    console.log('Fetching tasks for user:', req.user.sub, 'org:', req.user.organizationId);
    const connection = await dbPool.getConnection();

    const [rows] = await connection.execute(`
      SELECT t.*,
             creator.name as created_by_name, creator.email as created_by_email,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.assignee_id = ? AND t.organization_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.sub, req.user.organizationId]);

    connection.release();

    console.log('Found', rows.length, 'tasks for user');
    const tasks = rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date,
      assigneeId: row.assignee_id,
      createdBy: row.created_by_name ? {
        id: row.created_by,
        name: row.created_by_name,
        email: row.created_by_email
      } : null,
      project: row.project_name ? {
        id: row.project_id,
        name: row.project_name
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Fetch my tasks error:', error);
    // Always return an array to prevent frontend .map() errors
    res.status(200).json([]);
  }
});

// PM/Admin creates task assigned to a member
app.post('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assigneeId, priority = 'Medium', dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!assigneeId) {
      return res.status(400).json({ error: 'Assignee is required for PM task creation' });
    }

    // Check if user has permission (ADMIN or PROJECT_MANAGER)
    if (!['ADMIN', 'PROJECT_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only admins and project managers can assign tasks' });
    }

    const connection = await dbPool.getConnection();

    const [result] = await connection.execute(`
      INSERT INTO tasks (id, title, description, status, priority, assignee_id, project_id, due_date, created_by, organization_id, created_at, updated_at)
      VALUES (UUID(), ?, ?, 'assigned', ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, description, priority, assigneeId, projectId, dueDate, req.user.sub, req.user.organizationId]);

    // Log activity
    await recordTaskActivity(connection, { taskId: result.insertId || 'UNKNOWN', action: 'created', performedBy: req.user.sub, newValue: title });

    connection.release();

    res.status(201).json({
      message: 'Task created and assigned successfully'
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Member self-create task (auto-assigned and in progress)
app.post('/api/projects/:projectId/tasks/self', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority = 'Medium', dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const connection = await dbPool.getConnection();

    const [result] = await connection.execute(`
      INSERT INTO tasks (id, title, description, status, priority, assignee_id, project_id, due_date, created_by, organization_id, created_at, updated_at)
      VALUES (UUID(), ?, ?, 'in_progress', ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, description, priority, req.user.sub, projectId, dueDate, req.user.sub, req.user.organizationId]);

    connection.release();

    res.status(201).json({
      message: 'Task created successfully',
      taskId: result.insertId
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Legacy endpoint for backward compatibility
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, description, status = 'assigned', priority = 'Medium', assigneeId, projectId, dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const connection = await dbPool.getConnection();

    const [result] = await connection.execute(`
      INSERT INTO tasks (id, title, description, status, priority, assignee_id, project_id, due_date, created_by, organization_id, created_at, updated_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, description, status, priority, assigneeId, projectId, dueDate, req.user.sub, req.user.organizationId]);

    connection.release();

    res.status(201).json({
      message: 'Task created successfully',
      taskId: result.insertId
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assigneeId, projectId, dueDate } = req.body;

    const connection = await dbPool.getConnection();

    const [result] = await connection.execute(`
      UPDATE tasks
      SET title = ?, description = ?, status = ?, priority = ?, assignee_id = ?, project_id = ?, due_date = ?, updated_at = NOW()
      WHERE id = ? AND organization_id = ?
    `, [title, description, status, priority, assigneeId, projectId, dueDate, id, req.user.organizationId]);

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Task status update endpoint
app.patch('/api/tasks/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const connection = await dbPool.getConnection();

    // Check if user has permission to update this task
    const [taskRows] = await connection.execute(`
      SELECT * FROM tasks WHERE id = ? AND organization_id = ?
    `, [id, req.user.organizationId]);

    if (taskRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskRows[0];

    // Only assignee, creator, or admin/PM can update task status
    const canUpdate = task.assignee_id === req.user.sub ||
                     task.created_by === req.user.sub ||
                     ['ADMIN', 'PROJECT_MANAGER'].includes(req.user.role);

    if (!canUpdate) {
      connection.release();
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    // Update task status and set completed_at if status is completed
    const completedAt = status.toLowerCase().includes('completed') || status.toLowerCase().includes('done') ? 'NOW()' : 'NULL';

    const [result] = await connection.execute(`
      UPDATE tasks
      SET status = ?, completed_at = ${completedAt}, updated_at = NOW()
      WHERE id = ? AND organization_id = ?
    `, [status, id, req.user.organizationId]);

    // Log activity
    await recordTaskActivity(connection, { taskId: id, action: 'status_changed', field: 'status', oldValue: task.status, newValue: status, performedBy: req.user.sub });

    connection.release();

    res.json({
      message: 'Task status updated successfully',
      status: status,
      completedAt: completedAt !== 'NULL' ? new Date().toISOString() : null
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Task deletion endpoint
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await dbPool.getConnection();

    // Check if user has permission to delete this task
    const [taskRows] = await connection.execute(`
      SELECT * FROM tasks WHERE id = ? AND organization_id = ?
    `, [id, req.user.organizationId]);

    if (taskRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskRows[0];

    // Only creator or admin/PM can delete task
    const canDelete = task.created_by === req.user.sub ||
                     ['ADMIN', 'PROJECT_MANAGER'].includes(req.user.role);

    if (!canDelete) {
      connection.release();
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    const [result] = await connection.execute(`
      DELETE FROM tasks WHERE id = ? AND organization_id = ?
    `, [id, req.user.organizationId]);

    connection.release();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Task start endpoint (member starts assigned task)
app.patch('/api/tasks/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await dbPool.getConnection();

    // Check if user has permission to start this task
    const [taskRows] = await connection.execute(`
      SELECT * FROM tasks WHERE id = ? AND organization_id = ?
    `, [id, req.user.organizationId]);

    if (taskRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskRows[0];

    // Only assignee can start the task
    if (task.assignee_id !== req.user.sub) {
      connection.release();
      return res.status(403).json({ error: 'Only the assignee can start this task' });
    }

    // Update task status to in_progress

    // Log activity (starting)
    await recordTaskActivity(connection, { taskId: id, action: 'started', performedBy: req.user.sub });

    const [result] = await connection.execute(`
      UPDATE tasks
// Task attachments endpoints
app.post('/api/tasks/:id/attachments', authenticateToken, uploadTaskAttachment.single('file'), async (req, res) => {
  const { id } = req.params;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  let connection;
  try {
    connection = await dbPool.getConnection();

    // Ensure task belongs to user's org
    const [rows] = await connection.execute('SELECT id FROM tasks WHERE id = ? AND organization_id = ?', [id, req.user.organizationId]);
    if (rows.length === 0) {
      connection.release();
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Task not found' });
    }

    await connection.execute(`
      INSERT INTO task_attachments (id, task_id, file_name, file_path, mime_type, size, uploaded_by, created_at)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?, NOW())
    `, [id, file.originalname, file.filename, file.mimetype, file.size, req.user.sub]);

    // Log activity
    await recordTaskActivity(connection, { taskId: id, action: 'attachment_added', field: 'attachment', newValue: file.originalname, performedBy: req.user.sub });

    connection.release();

    res.json({ message: 'Attachment uploaded', file: { name: file.originalname, url: `/uploads/task_attachments/${file.filename}`, size: file.size, type: file.mimetype } });
  } catch (error) {
    if (connection) connection.release();
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });

// Task comments endpoints
app.get('/api/tasks/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params; let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute(`
      SELECT c.id, c.content, c.created_at, c.updated_at, u.id as author_id, u.name as author_name, u.email as author_email
      FROM task_comments c
      JOIN users u ON u.id = c.author_id
      WHERE c.task_id = ?
      ORDER BY c.created_at DESC
    `, [id]);
    connection.release();
    res.json(rows.map(r => ({
      id: r.id,
      content: r.content,
      author: { id: r.author_id, name: r.author_name, email: r.author_email },
      createdAt: r.created_at,
      updatedAt: r.updated_at
    })));
  } catch (error) {
    if (connection) connection.release();
    console.error('List task comments error:', error);
    res.status(500).json({ error: 'Failed to list task comments' });
  }
});

app.post('/api/tasks/:id/comments', authenticateToken, async (req, res) => {
  const { id } = req.params; const { content } = req.body; let connection;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });
  try {
    connection = await dbPool.getConnection();

    // Ensure task exists and user has access (assignee or creator). Keep it simple: check existence only
    const [taskRows] = await connection.execute(`SELECT id, title FROM tasks WHERE id = ?`, [id]);
    if (!Array.isArray(taskRows) || taskRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Task not found' });
    }

    const [result] = await connection.execute(`
      INSERT INTO task_comments (id, task_id, author_id, content, created_at, updated_at)
      VALUES (UUID(), ?, ?, ?, NOW(), NOW())
    `, [id, req.user.sub, content.trim()]);

    // Fetch the created comment with author info
    const [rows] = await connection.execute(`
      SELECT c.id, c.content, c.created_at, c.updated_at, u.id as author_id, u.name as author_name, u.email as author_email
      FROM task_comments c
      JOIN users u ON u.id = c.author_id
      WHERE c.task_id = ? AND c.id = (SELECT id FROM task_comments WHERE task_id = ? ORDER BY created_at DESC LIMIT 1)
    `, [id, id]);

    // Log activity
    await recordTaskActivity(connection, { taskId: id, action: 'commented', field: 'comment', newValue: content.trim(), performedBy: req.user.sub });

    connection.release();

    const r = Array.isArray(rows) && rows[0];
    return res.status(201).json(r ? {
      id: r.id,
      content: r.content,
      author: { id: r.author_id, name: r.author_name, email: r.author_email },
      createdAt: r.created_at,
      updatedAt: r.updated_at
    } : { message: 'Comment added' });
  } catch (error) {
    if (connection) connection.release();
    console.error('Create task comment error:', error);
    res.status(500).json({ error: 'Failed to add task comment' });
  }
});

  }
});

app.get('/api/tasks/:id/attachments', authenticateToken, async (req, res) => {
  const { id } = req.params; let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute(`
      SELECT id, file_name, file_path, mime_type, size, uploaded_by, created_at
      FROM task_attachments WHERE task_id = ? ORDER BY created_at DESC
    `, [id]);
    connection.release();
    res.json(rows.map(r => ({ id: r.id, name: r.file_name, url: `/uploads/task_attachments/${r.file_path}`, type: r.mime_type, size: r.size, uploadedBy: r.uploaded_by, createdAt: r.created_at })));
  } catch (error) {
    if (connection) connection.release();
    console.error('List attachments error:', error);
    res.status(500).json({ error: 'Failed to list attachments' });
  }
});

app.get('/api/tasks/:id/activities', authenticateToken, async (req, res) => {
  const { id } = req.params; let connection;
  try {
    connection = await dbPool.getConnection();
    const [rows] = await connection.execute(`
      SELECT id, action, field, old_value, new_value, performed_by, created_at
      FROM task_activities WHERE task_id = ? ORDER BY created_at DESC
    `, [id]);
    connection.release();
    res.json(rows.map(r => ({ id: r.id, action: r.action, field: r.field, oldValue: r.old_value, newValue: r.new_value, performedBy: r.performed_by, createdAt: r.created_at })));
  } catch (error) {
    if (connection) connection.release();
    console.error('List task activities error:', error);
    res.status(500).json({ error: 'Failed to list task activities' });
  }
});

      SET status = 'in_progress', updated_at = NOW()
      WHERE id = ? AND organization_id = ?
    `, [id, req.user.organizationId]);

    connection.release();

    res.json({
      message: 'Task started successfully',
      status: 'in_progress'
    });
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({ error: 'Failed to start task' });
  }
});

// Get task by ID
app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await dbPool.getConnection();

    const [rows] = await connection.execute(`
      SELECT t.*,
             u.name as assignee_name, u.email as assignee_email,
             creator.name as created_by_name, creator.email as created_by_email,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND t.organization_id = ?
    `, [id, req.user.organizationId]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = rows[0];
    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date,
      assigneeId: task.assignee_id,
      assignee: task.assignee_id ? {
        id: task.assignee_id,
        name: task.assignee_name,
        email: task.assignee_email
      } : null,
      createdBy: {
        id: task.created_by,
        name: task.created_by_name,
        email: task.created_by_email
      },
      project: {
        id: task.project_id,
        name: task.project_name
      },
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      completedAt: task.completed_at
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Board endpoints (basic implementation)
app.get('/api/boards', authenticateToken, async (req, res) => {
  try {
    // For now, return a simple board structure based on tasks
    res.json([
      {
        id: 'default-board',
        name: 'Task Board',
        description: 'Default task board',
        columns: [
          { id: 'assigned', name: 'Assigned', tasks: [] },
          { id: 'in_progress', name: 'In Progress', tasks: [] },
          { id: 'completed', name: 'Completed', tasks: [] }
        ]
      }
    ]);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

app.get('/api/boards/me', authenticateToken, async (req, res) => {
  try {
    // Return user's personal board
    res.json({
      id: 'my-board',
      name: 'My Tasks',
      description: 'Personal task board',
      columns: [
        { id: 'assigned', name: 'Assigned', tasks: [] },
        { id: 'in_progress', name: 'In Progress', tasks: [] },
        { id: 'completed', name: 'Completed', tasks: [] }
      ]
    });
  } catch (error) {
    console.error('Error fetching user board:', error);
    res.status(500).json({ error: 'Failed to fetch user board' });
  }
});

// Audit endpoints (basic implementation)
app.get('/api/audit/my-activity', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    // For now, return empty array - can be implemented later
    res.json([]);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const connection = await dbPool.getConnection();

    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);

    // Check organizations table specifically
    let orgCount = 0, userCount = 0;
    try {
      const [orgResult] = await connection.execute('SELECT COUNT(*) as count FROM organizations');
      orgCount = orgResult[0].count;
    } catch (e) {
      console.log('Organizations table not found');
    }

    try {
      const [userResult] = await connection.execute('SELECT COUNT(*) as count FROM users');
      userCount = userResult[0].count;
    } catch (e) {
      console.log('Users table not found');
    }

    connection.release();

    res.json({
      status: 'Connected',
      database: dbConfig.database,
      tables: tableNames,
      counts: {
        organizations: orgCount,
        users: userCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Database data endpoint
app.get('/api/db-data', async (req, res) => {
  try {
    const connection = await dbPool.getConnection();

    // Get organizations
    const [orgs] = await connection.execute('SELECT id, name, created_at FROM organizations LIMIT 5');

    // Get users
    const [users] = await connection.execute('SELECT id, email, name, role, organization_id, created_at FROM users LIMIT 10');

    connection.release();

    res.json({
      status: 'Success',
      organizations: orgs,
      users: users,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Project endpoints
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const connection = await dbPool.getConnection();
    const [rows] = await connection.execute(
      'SELECT p.*, u.name as owner_name FROM projects p LEFT JOIN users u ON p.owner_id = u.id WHERE p.organization_id = ? ORDER BY p.created_at DESC',
      [req.user.organizationId]
    );
    connection.release();

    const projects = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status || 'active',
      startDate: row.start_date,
      endDate: row.end_date,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      organizationId: row.organization_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(200).json([]);
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  let connection;
  try {
    const { name, description, status = 'active', startDate, endDate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Only admins can create projects
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can create projects' });
    }

    connection = await dbPool.getConnection();

    // Generate UUID for the project (using MySQL UUID() function)
    const [uuidResult] = await connection.execute('SELECT UUID() as id');
    const projectId = uuidResult[0].id;

    // Convert undefined to null for SQL
    const safeDescription = description || null;
    const safeStartDate = startDate || null;
    const safeEndDate = endDate || null;

    const [result] = await connection.execute(`
      INSERT INTO projects (id, name, description, status, start_date, end_date, organization_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [projectId, name, safeDescription, status, safeStartDate, safeEndDate, req.user.organizationId]);

    // Get the created project
    const [projectRows] = await connection.execute(
      'SELECT p.*, u.name as owner_name FROM projects p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ?',
      [projectId]
    );

    if (projectRows.length === 0) {
      return res.status(500).json({ error: 'Failed to retrieve created project' });
    }

    const project = projectRows[0];
    res.status(201).json({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      ownerId: project.owner_id,
      ownerName: project.owner_name,
      organizationId: project.organization_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      error: 'Failed to create project',
      details: error.message,
      code: error.code
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await dbPool.getConnection();

    const [rows] = await connection.execute(
      'SELECT p.*, u.name as owner_name FROM projects p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ? AND p.organization_id = ?',
      [id, req.user.organizationId]
    );

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = rows[0];
    res.json({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      ownerId: project.owner_id,
      ownerName: project.owner_name,
      organizationId: project.organization_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.patch('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, startDate, endDate } = req.body;

    // Only admins and project owners can update projects
    if (req.user.role !== 'ADMIN') {
      const connection = await dbPool.getConnection();
      const [projectRows] = await connection.execute(
        'SELECT owner_id FROM projects WHERE id = ? AND organization_id = ?',
        [id, req.user.organizationId]
      );
      connection.release();

      if (projectRows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (projectRows[0].owner_id !== req.user.sub) {
        return res.status(403).json({ error: 'Only project owners and administrators can update projects' });
      }
    }

    const connection = await dbPool.getConnection();

    const [result] = await connection.execute(`
      UPDATE projects
      SET name = ?, description = ?, status = ?, start_date = ?, end_date = ?, updated_at = NOW()
      WHERE id = ? AND organization_id = ?
    `, [name, description, status, startDate, endDate, id, req.user.organizationId]);

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the updated project
    const [projectRows] = await connection.execute(
      'SELECT p.*, u.name as owner_name FROM projects p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ? AND p.organization_id = ?',
      [id, req.user.organizationId]
    );

    connection.release();

    const project = projectRows[0];
    res.json({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      ownerId: project.owner_id,
      ownerName: project.owner_name,
      organizationId: project.organization_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});


// Project members endpoints
app.get('/api/projects/:projectId/members', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  let connection;
  try {
    connection = await dbPool.getConnection();

    // Verify project belongs to org
    const [proj] = await connection.execute(
      'SELECT id FROM projects WHERE id = ? AND organization_id = ?',
      [projectId, req.user.organizationId]
    );
    if (proj.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const [rows] = await connection.execute(
      `SELECT u.id, u.name, u.email, u.role as userRole, pm.role as projectRole
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? AND u.organization_id = ?
       ORDER BY u.name ASC`,
      [projectId, req.user.organizationId]
    );

    const members = rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.userRole,
      projectRole: r.projectRole
    }));

    res.json({ members });
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ error: 'Failed to fetch project members' });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/projects/:projectId/members', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { userId } = req.body || {};
  let connection;
  try {
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Only admins and project managers can assign users
    if (req.user.role !== 'ADMIN' && req.user.role !== 'PROJECT_MANAGER') {
      return res.status(403).json({ error: 'Only administrators and project managers can assign users to projects' });
    }

    connection = await dbPool.getConnection();

    // Verify project belongs to org
    const [proj] = await connection.execute(
      'SELECT id FROM projects WHERE id = ? AND organization_id = ?',
      [projectId, req.user.organizationId]
    );
    if (proj.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify user belongs to org and get user role
    const [userRows] = await connection.execute(
      'SELECT id, role FROM users WHERE id = ? AND organization_id = ?',
      [userId, req.user.organizationId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRole = userRows[0].role || 'MEMBER';

    try {
      await connection.execute(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, userId, userRole]
      );
    } catch (err) {
      // Handle duplicate association gracefully
      if (err && (err.code === 'ER_DUP_ENTRY' || String(err.message).includes('duplicate'))) {
        return res.status(200).json({ message: 'User already assigned to this project' });
      }
      throw err;
    }

    res.status(201).json({ message: 'User assigned to project' });
  } catch (error) {
    console.error('Assign user to project error:', error);
    res.status(500).json({ error: 'Failed to assign user to project', details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

app.delete('/api/projects/:projectId/members/:userId', authenticateToken, async (req, res) => {
  const { projectId, userId } = req.params;
  let connection;
  try {
    // Only admins and project managers can remove users
    if (req.user.role !== 'ADMIN' && req.user.role !== 'PROJECT_MANAGER') {
      return res.status(403).json({ error: 'Only administrators and project managers can remove users from projects' });
    }

    connection = await dbPool.getConnection();

    const [result] = await connection.execute(
      'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'User removed from project' });
  } catch (error) {
    console.error('Remove user from project error:', error);
    res.status(500).json({ error: 'Failed to remove user from project' });
  } finally {
    if (connection) connection.release();
  }
});

// Organization logo endpoints
app.get('/api/organization/logo', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const organizationId = decoded.organizationId;

    if (!organizationId) {
      return res.status(400).json({ error: 'No organization associated with user' });
    }

    const connection = await dbPool.getConnection();

    try {
      // Get organization logo path
      const [orgResult] = await connection.execute(
        'SELECT logo_path FROM organizations WHERE id = ?',
        [organizationId]
      );

      connection.release();

      if (orgResult.length === 0) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const logoPath = orgResult[0].logo_path;
      if (!logoPath) {
        return res.status(404).json({ error: 'No logo found for organization' });
      }

      // Check if file exists and serve it
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.join(__dirname, 'uploads', 'logos', logoPath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Logo file not found' });
      }

      res.sendFile(fullPath);
    } catch (dbError) {
      connection.release();
      throw dbError;
    }
  } catch (error) {
    console.error('Get organization logo error:', error);
    res.status(500).json({ error: 'Failed to retrieve organization logo' });
  }
});

app.post('/api/organization/logo', upload.single('logo'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const organizationId = decoded.organizationId;
    const userRole = decoded.role;

    if (!organizationId) {
      return res.status(400).json({ error: 'No organization associated with user' });
    }

    // Only admins can update organization logo
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can update organization logo' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No logo file provided' });
    }

    const connection = await dbPool.getConnection();

    try {
      // Get current logo path to delete old file
      const [currentOrg] = await connection.execute(
        'SELECT logo_path FROM organizations WHERE id = ?',
        [organizationId]
      );

      // Delete old logo file if it exists
      if (currentOrg.length > 0 && currentOrg[0].logo_path) {
        const oldFilePath = path.join(__dirname, 'uploads', 'logos', currentOrg[0].logo_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Update organization with new logo path
      const logoPath = req.file.filename;
      await connection.execute(
        'UPDATE organizations SET logo_path = ?, updated_at = NOW() WHERE id = ?',
        [logoPath, organizationId]
      );

      connection.release();

      // Return the logo URL that frontend expects
      const logoUrl = `/uploads/logos/${logoPath}`;
      res.json({ logoUrl });
    } catch (dbError) {
      connection.release();
      // Delete uploaded file if database update fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Upload organization logo error:', error);
    res.status(500).json({ error: 'Failed to upload organization logo' });
  }
});

// Debug endpoint to create projects table
app.post('/api/debug/create-projects-table', async (req, res) => {
  let connection;
  try {
    connection = await dbPool.getConnection();

    // Create projects table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        owner_id VARCHAR(36),
        organization_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )
    `);

    res.json({
      status: 'Success',
      message: 'Projects table created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Database schema endpoint
app.get('/api/db-schema', async (req, res) => {
  let connection;
  try {
    connection = await dbPool.getConnection();

    // Get users table schema
    const [usersSchema] = await connection.execute('DESCRIBE users');

    // Get organizations table schema
    const [orgsSchema] = await connection.execute('DESCRIBE organizations');

    // Get projects table schema
    let projectsSchema = [];
    try {
      const [projSchema] = await connection.execute('DESCRIBE projects');
      projectsSchema = projSchema;
    } catch (error) {
      console.log('Projects table does not exist:', error.message);
    }

    // Get tasks table schema
    let tasksSchema = [];
    try {
      const [taskSchema] = await connection.execute('DESCRIBE tasks');
      tasksSchema = taskSchema;
    } catch (error) {
      console.log('Tasks table does not exist:', error.message);
    }

    res.json({
      status: 'Success',
      usersSchema: usersSchema,
      organizationsSchema: orgsSchema,
      projectsSchema: projectsSchema,
      tasksSchema: tasksSchema,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    if (connection) {
      connection.release();
    }
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
