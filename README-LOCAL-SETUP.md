# PMActivities2 - Local Development Setup

## 🚀 Quick Start with MySQL & Docker

This guide will help you set up the PMActivities2 application locally using MySQL with Docker. The setup follows the **single source of truth** principle - all configuration is centralized and can be changed in one place.

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js** 18+ and **npm**
- **Git** for version control

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     MySQL       │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│   (Docker)      │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 3306    │
│                 │    │                 │    │  PMActivity2    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 Single Source Configuration

All configuration is centralized in these files:
- `config/app.config.js` - Main application configuration
- `.env` - Environment variables
- `activity-tracker/frontend/src/config/app.config.ts` - Frontend configuration

**Change once, reflects everywhere!**

## 🚀 Automated Setup (Recommended)

### Option 1: Linux/macOS
```bash
# Make script executable and run
chmod +x scripts/start-local.sh
./scripts/start-local.sh
```

### Option 2: Windows
```cmd
# Run the Windows batch script
scripts\start-local.bat
```

The automated script will:
1. ✅ Check Docker availability
2. ✅ Create environment configuration
3. ✅ Start MySQL database with Docker
4. ✅ Start phpMyAdmin for database management
5. ✅ Install dependencies for both frontend and backend
6. ✅ Provide next steps and useful commands

## 🔧 Manual Setup

### Step 1: Environment Configuration

1. Copy the environment template:
```bash
cp .env.local .env
```

2. Customize `.env` if needed (optional):
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=app_user
DB_PASSWORD=app_password123
DB_NAME=PMActivity2

# Application Ports
BACKEND_PORT=3001
FRONTEND_PORT=3000

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Step 2: Start Database Services

```bash
# Start MySQL and phpMyAdmin
docker-compose -f docker-compose.local.yml up -d

# Check if services are running
docker-compose -f docker-compose.local.yml ps
```

### Step 3: Install Dependencies

```bash
# Backend dependencies
cd activity-tracker/backend
npm install

# Frontend dependencies
cd ../frontend
npm install
cd ../..
```

### Step 4: Start Application Services

```bash
# Terminal 1: Start Backend
cd activity-tracker/backend
npm run start:dev

# Terminal 2: Start Frontend
cd activity-tracker/frontend
npm run dev
```

## 🌐 Access Points

Once everything is running:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application interface |
| **Backend API** | http://localhost:3001/api | REST API endpoints |
| **API Documentation** | http://localhost:3001/api-docs | Swagger/OpenAPI docs |
| **phpMyAdmin** | http://localhost:8080 | Database management |

## 🗄️ Database Information

| Setting | Value |
|---------|-------|
| **Host** | localhost:3306 |
| **Database** | PMActivity2 |
| **Username** | app_user |
| **Password** | app_password123 |
| **Root Password** | Jairam123! |

## 📁 Configuration Files Structure

```
├── config/
│   └── app.config.js                 # Main app configuration
├── .env                              # Environment variables
├── .env.local                        # Environment template
├── docker-compose.local.yml          # Docker services
├── database/
│   └── init/
│       └── 01-init.sql              # Database initialization
├── scripts/
│   ├── start-local.sh               # Linux/macOS startup
│   └── start-local.bat              # Windows startup
└── activity-tracker/
    ├── backend/
    │   └── src/config/database.config.ts
    └── frontend/
        └── src/config/app.config.ts
```

## 🔄 Key Features of This Setup

### ✅ Single Source of Truth
- All API endpoints defined in one place
- Database configuration centralized
- Environment variables managed consistently
- No hardcoded URLs or settings

### ✅ Easy Configuration Changes
- Change API URL once in config, reflects everywhere
- Modify database settings in one place
- Update ports centrally
- Environment-specific configurations

### ✅ Development-Friendly
- Hot reload for both frontend and backend
- Database persistence with Docker volumes
- Easy database reset and management
- Comprehensive logging and error handling

## 🛠️ Useful Commands

### Database Management
```bash
# Stop all services
docker-compose -f docker-compose.local.yml down

# Reset database (removes all data)
docker-compose -f docker-compose.local.yml down -v

# View database logs
docker-compose -f docker-compose.local.yml logs mysql

# Access MySQL CLI
docker exec -it pmactivities2-mysql mysql -u app_user -p
```

### Application Management
```bash
# Backend commands
cd activity-tracker/backend
npm run start:dev          # Development with hot reload
npm run build              # Production build
npm run test               # Run tests
npm run test:cov           # Test coverage

# Frontend commands
cd activity-tracker/frontend
npm run dev                # Development server
npm run build              # Production build
npm run test               # Run tests
npm run lint               # Code linting
```

## 🔍 Troubleshooting

### Database Connection Issues
1. Ensure Docker is running: `docker info`
2. Check if MySQL container is up: `docker ps`
3. Verify database credentials in `.env`
4. Check MySQL logs: `docker-compose -f docker-compose.local.yml logs mysql`

### Port Conflicts
1. Check if ports are in use: `lsof -i :3000` (macOS/Linux) or `netstat -an | findstr :3000` (Windows)
2. Change ports in `.env` file
3. Restart services

### Permission Issues (Linux/macOS)
```bash
# Make scripts executable
chmod +x scripts/start-local.sh

# Fix Docker permissions
sudo usermod -aG docker $USER
# Then logout and login again
```

## 🚀 Next Steps

1. **Start Development**: Follow the Quick Start guide above
2. **Explore API**: Visit http://localhost:3001/api-docs for API documentation
3. **Database Management**: Use phpMyAdmin at http://localhost:8080
4. **Configuration**: Modify `config/app.config.js` for application settings
5. **Testing**: Run tests with `npm run test` in both backend and frontend

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Happy Coding! 🎉**
