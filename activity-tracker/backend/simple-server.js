const express = require('./node_modules/express');
const cors = require('./node_modules/cors');
const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://pactivities-frontend.azurestaticapps.net',
    'https://pactivities-frontend-abdygcfedtfdavfh.canadacentral-01.azurewebsites.net'
  ],
  credentials: true
}));
app.use(express.json());

// Mock organization data
let organizationData = {
  id: '1',
  name: 'Test Organization',
  logoUrl: null,
  description: null,
  industry: 'Technology',
  size: '1-10',
  timezone: 'America/New_York',
  currency: 'USD',
  settings: {}
};

// Mock users data
const users = [
  {
    id: '1',
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    organization: organizationData
  },
  {
    id: '2',
    email: 'pm@test.com',
    password: 'pm123',
    name: 'Project Manager',
    role: 'project_manager',
    organization: organizationData
  },
  {
    id: '3',
    email: 'member@test.com',
    password: 'member123',
    name: 'Team Member',
    role: 'member',
    organization: organizationData
  }
];

// Mock projects data
const projects = [
  {
    id: 'p1',
    name: 'Website Revamp',
    description: 'Revamp the marketing website',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: [] // { id, role }
  },
  {
    id: 'p2',
    name: 'Mobile App',
    description: 'Build the new mobile app',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: []
  }
];

const DEFAULT_PASSWORD = 'changeme123';


// Authentication endpoints
app.post('/auth/login', (req, res) => {
  console.log('POST /auth/login', req.body);
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = `mock-jwt-token-${user.id}`;
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Admin helper endpoints
app.get('/auth/default-password', (req, res) => {
  res.json({ password: DEFAULT_PASSWORD });
});

// Projects endpoints
app.get('/projects', (req, res) => {
  res.json(projects);
});

app.post('/projects', (req, res) => {
  const { name, description } = req.body;
  const project = {
    id: `p${projects.length + 1}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    members: []
  };
  projects.push(project);
  res.json(project);
});

app.get('/projects/:id', (req, res) => {
  const p = projects.find(pr => pr.id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Project not found' });
  res.json(p);
});

app.get('/projects/:id/members', (req, res) => {
  const p = projects.find(pr => pr.id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Project not found' });
  res.json(p.members);
});

app.post('/projects/:id/members', (req, res) => {
  const p = projects.find(pr => pr.id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Project not found' });
  const { userId } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!p.members.find(m => m.id === userId)) {
    p.members.push({ id: userId, role: user.role });
    p.updatedAt = new Date().toISOString();
  }
  res.json({ success: true });
});

// Users endpoints (minimal)
app.get('/users', (req, res) => {
  res.json(users.map(({ password, ...u }) => u));
});

app.get('/users/:id', (req, res) => {
  const u = users.find(u => u.id === req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  const { password, ...rest } = u;
  res.json(rest);
});

app.post('/users/:userId/projects/:projectId', (req, res) => {
  const p = projects.find(pr => pr.id === req.params.projectId);
  const u = users.find(us => us.id === req.params.userId);
  if (!p || !u) return res.status(404).json({ message: 'Not found' });
  if (!p.members.find(m => m.id === u.id)) {
    p.members.push({ id: u.id, role: u.role });
    p.updatedAt = new Date().toISOString();
  }
  res.json({ success: true });
});


app.get('/auth/profile', (req, res) => {
  console.log('GET /auth/profile');
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('mock-jwt-token-', '');
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
});

// Organization endpoints
app.get('/organization', (req, res) => {
  console.log('GET /organization');
  res.json(organizationData);
});

app.put('/organization', (req, res) => {
  console.log('PUT /organization', req.body);
  organizationData = { ...organizationData, ...req.body };
  res.json(organizationData);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PActivities Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /auth/login');
  console.log('  GET  /auth/profile');
  console.log('  GET  /organization');
  console.log('  PUT  /organization');
  console.log('  GET  /health');
  console.log('');
  console.log('Test Users:');
  console.log('  Admin: admin@test.com / admin123');
  console.log('  PM: pm@test.com / pm123');
  console.log('  Member: member@test.com / member123');
});
