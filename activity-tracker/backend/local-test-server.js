const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'PMActivities2 Backend is running locally',
    version: '2.0.0-local',
    timestamp: new Date().toISOString(),
    environment: 'local-development',
    database: 'disconnected (local test mode)'
  });
});

// Mock API endpoints for testing
app.get('/api/organizations', (req, res) => {
  res.json([
    { id: 1, name: 'Test Organization', description: 'Local test organization' }
  ]);
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
    { id: 2, username: 'pm1', email: 'pm1@test.com', role: 'project_manager' },
    { id: 3, username: 'member1', email: 'member1@test.com', role: 'member' }
  ]);
});

app.get('/api/projects', (req, res) => {
  res.json([
    { id: 1, name: 'Test Project', description: 'Local test project', status: 'active' }
  ]);
});

app.get('/api/activities', (req, res) => {
  res.json([
    { 
      id: 1, 
      title: 'Test Activity', 
      description: 'Local test activity',
      status: 'in_progress',
      assignedTo: 'member1',
      createdAt: new Date().toISOString()
    }
  ]);
});

// Auth endpoints (mock)
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Mock authentication
  if (username && password) {
    res.json({
      access_token: 'mock-jwt-token-for-local-testing',
      user: {
        id: 1,
        username: username,
        email: `${username}@test.com`,
        role: username === 'admin' ? 'admin' : username.startsWith('pm') ? 'project_manager' : 'member'
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'PActivities Backend - Local Test Mode',
    availableEndpoints: [
      'GET /health',
      'GET /api/organizations',
      'GET /api/users',
      'GET /api/projects',
      'GET /api/activities',
      'POST /auth/login'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PMActivities2 Backend (Local Test) running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Test mode: Database disconnected, using mock data`);
});
