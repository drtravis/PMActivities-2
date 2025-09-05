# PMActivity2 Database Migration Guide

## 🎯 Overview

The PMActivities2 application has been updated to use a new database called **PMActivity2**. This migration maintains the single source of truth configuration principle while providing a clean, fresh database environment.

**Naming Convention:**
- **Application/Folder**: PMActivities2
- **Database**: PMActivity2
- **GitHub Repo**: PMActivities2
- **Docker Containers**: pmactivities2-mysql, pmactivities2-phpmyadmin

## 🔄 What Changed

### Database Name Migration
- **Old Database**: `activity_tracker`
- **New Database**: `PMActivity2`

### Updated Configuration Files
All configuration files have been updated to use PMActivity2:

```
✅ config/app.config.js                    # Main configuration
✅ .env                                     # Environment variables
✅ .env.local                               # Environment template
✅ docker-compose.local.yml                 # Docker configuration
✅ database/init/01-init.sql                # Database initialization
✅ activity-tracker/backend/src/config/database.config.ts
✅ scripts/start-local.sh                   # Linux/macOS startup
✅ scripts/start-local.bat                  # Windows startup
✅ README-LOCAL-SETUP.md                    # Documentation
```

## 🚀 Quick Setup for PMActivity2

### Option 1: Automated Setup (Recommended)

#### Linux/macOS:
```bash
# Setup PMActivity2 database
./scripts/setup-pmactivity2.sh
```

#### Windows:
```cmd
# Setup PMActivity2 database
scripts\setup-pmactivity2.bat
```

### Option 2: Manual Setup

1. **Stop existing containers:**
```bash
docker-compose -f docker-compose.local.yml down -v
```

2. **Start PMActivity2 database:**
```bash
docker-compose -f docker-compose.local.yml up -d mysql
```

3. **Wait for initialization and start phpMyAdmin:**
```bash
docker-compose -f docker-compose.local.yml up -d phpmyadmin
```

4. **Start the application:**
```bash
# Backend
cd activity-tracker/backend && npm run start:dev

# Frontend (in another terminal)
cd activity-tracker/frontend && npm run dev
```

## 📊 PMActivity2 Database Information

| Setting | Value |
|---------|-------|
| **Database Name** | PMActivity2 |
| **Host** | localhost:3306 |
| **Username** | app_user |
| **Password** | app_password123 |
| **Root Password** | rootpassword123 |
| **phpMyAdmin** | http://localhost:8080 |

## 🔧 Configuration Details

### Environment Variables (.env)
```env
# Database Configuration - PMActivity2
DB_NAME=PMActivity2
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=app_user
DB_PASSWORD=app_password123
```

### Main Configuration (config/app.config.js)
```javascript
database: {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'app_user',
  password: process.env.DB_PASSWORD || 'app_password123',
  database: process.env.DB_NAME || 'PMActivity2',  // ← Updated
  // ... other settings
}
```

### Docker Compose (docker-compose.local.yml)
```yaml
environment:
  MYSQL_ROOT_PASSWORD: rootpassword123
  MYSQL_DATABASE: PMActivity2  # ← Updated
  MYSQL_USER: app_user
  MYSQL_PASSWORD: app_password123
```

## 🗄️ Database Schema

PMActivity2 will be automatically populated with tables by TypeORM when you start the backend:

- **organizations** - Multi-tenant organization data
- **users** - User accounts with role-based access
- **projects** - Project management
- **activities** - Activity tracking with approval workflow
- **tasks** - Task management with status tracking
- **boards** - Personal task boards (Monday.com style)
- **comments** - Activity and task comments
- **audit_logs** - Comprehensive audit trail
- **status_configuration** - Customizable status workflows

## 🔍 Verification Steps

1. **Validate Configuration:**
```bash
node scripts/validate-config.js
```

2. **Check Database Connection:**
```bash
# After starting MySQL container
docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "USE PMActivity2; SHOW TABLES;"
```

3. **Verify Application Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- API Documentation: http://localhost:3001/api-docs
- phpMyAdmin: http://localhost:8080

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Check if PMActivity2 database exists
docker exec pmactivities2-mysql mysql -u root -prootpassword123 -e "SHOW DATABASES;"

# Recreate database if needed
docker exec pmactivities2-mysql mysql -u root -prootpassword123 -e "DROP DATABASE IF EXISTS PMActivity2; CREATE DATABASE PMActivity2;"
```

### Clean Reset
```bash
# Complete reset with new PMActivity2 database
docker-compose -f docker-compose.local.yml down -v
./scripts/setup-pmactivity2.sh
```

### Permission Issues
```bash
# Fix user permissions for PMActivity2
docker exec pmactivities2-mysql mysql -u root -p'Jairam123!' -e "GRANT ALL PRIVILEGES ON PMActivity2.* TO 'app_user'@'%'; FLUSH PRIVILEGES;"
```

## 🎯 Benefits of PMActivity2

1. **Clean Start**: Fresh database without legacy data
2. **Consistent Naming**: Better alignment with project naming
3. **Single Source Configuration**: All settings centralized
4. **Easy Migration**: Automated setup scripts
5. **Development Ready**: TypeORM will create all necessary tables

## 🚀 Next Steps

1. **Run Setup**: Use `./scripts/setup-pmactivity2.sh` for automated setup
2. **Start Development**: Backend and frontend as usual
3. **Verify Tables**: Check phpMyAdmin to see TypeORM-created tables
4. **Test Application**: Create organizations, users, and projects
5. **Monitor Logs**: Check backend logs for any database issues

## 📚 Additional Resources

- **Main Setup Guide**: `README-LOCAL-SETUP.md`
- **Configuration Reference**: `config/app.config.js`
- **Database Scripts**: `database/init/01-init.sql`
- **Docker Configuration**: `docker-compose.local.yml`

---

**PMActivity2 is ready for development! 🎉**
