# Development Guide - PMActivities 2

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/drtravis/PMActivities-2.git
cd PMActivities-2

# Switch to development branch
git checkout development

# Install dependencies
cd activity-tracker/frontend
npm install

# Start development server
npm run dev
```

### Development Server
- **Local URL**: http://localhost:3000
- **Hot Reload**: Enabled
- **Environment**: Development

## 🌿 Branch Strategy

### Branch Structure:
```
main (production)
├── v1.0.0 (tagged release)
├── development (active development)
├── windsurf (Windsurf-specific development)
│   ├── feature/windsurf-ui-changes
│   └── feature/windsurf-components
└── feature branches
    ├── feature/new-dashboard
    ├── feature/user-management
    └── bugfix/login-issue
```

### Workflow:
1. **Create Feature Branch**:
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   ```

2. **Develop Locally**:
   ```bash
   # Make changes
   npm run dev  # Test locally
   git add .
   git commit -m "Add: your feature description"
   ```

3. **Merge to Development**:
   ```bash
   git checkout development
   git merge feature/your-feature-name
   git push origin development
   ```

4. **Deploy to Production** (when stable):
   ```bash
   # Create PR: development → main
   # This triggers Azure deployment
   ```

## 🔧 Development Commands

### Frontend Development:
```bash
cd activity-tracker/frontend

# Start development server
npm run dev

# Build for production
npm run build

# Start production server locally
npm start

# Lint code
npm run lint

# Type checking
npm run type-check
```

### Backend Development:
```bash
cd activity-tracker/backend

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 🧪 Testing Strategy

### Local Testing:
- Test all pages: `/`, `/login`, `/setup`, `/demo`
- Test navigation buttons functionality
- Test responsive design on different screen sizes
- Test animations and hover effects

### Pre-deployment Checklist:
- [ ] All features work locally
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Navigation buttons work correctly
- [ ] Forms submit properly
- [ ] Authentication flow works
- [ ] Build completes without errors

## 🚀 Deployment Process

### Current Setup:
- **Production**: Auto-deploys from `main` branch
- **Development**: Local testing only
- **Azure URL**: https://blue-mushroom-07499561e.2.azurestaticapps.net/

### Deployment Steps:
1. **Develop locally** on `development` branch
2. **Test thoroughly** with `npm run dev`
3. **Create feature branches** for specific work
4. **Merge stable features** to `development`
5. **When ready for production**:
   - Create PR: `development` → `main`
   - Review changes
   - Merge PR (triggers Azure deployment)
   - Tag new version if major release

### Version Tagging:
```bash
# After successful deployment
git checkout main
git pull origin main
git tag -a v1.1.0 -m "Release v1.1.0 - New features"
git push origin v1.1.0
```

## 🔒 Environment Variables

### Development (.env.local):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
```

### Production (Azure):
```env
NEXT_PUBLIC_API_URL=https://pmactivities-backend1.icyhill-61db6701.westus2.azurecontainerapps.io
NODE_ENV=production
```

## 📁 Project Structure

```
PMActivities-2/
├── activity-tracker/
│   ├── frontend/          # Next.js frontend
│   │   ├── src/app/       # App router pages
│   │   ├── src/components/# Reusable components
│   │   └── src/lib/       # Utilities and API
│   └── backend/           # Node.js backend
├── .github/workflows/     # CI/CD workflows
├── VERSION.md            # Version history
├── DEVELOPMENT.md        # This file
└── README.md            # Project overview
```

## 🐛 Troubleshooting

### Common Issues:

1. **Port Already in Use**:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Node Modules Issues**:
   ```bash
   # Clean install
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Build Errors**:
   ```bash
   # Check for TypeScript errors
   npm run type-check
   
   # Check for linting issues
   npm run lint
   ```

## 📞 Support

- **Issues**: Create GitHub issues for bugs
- **Features**: Discuss in development branch PRs
- **Documentation**: Update this file for new processes
