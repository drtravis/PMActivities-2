# Activity Tracker - Multi-Tenant Web Application

A comprehensive, cloud-native activity tracking web application built with modern technologies and enterprise-grade features.

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Secure organization-based isolation
- **Role-based Access Control**: Admin, Project Manager, and Member roles
- **Activity Lifecycle Management**: Draft → Submit → Approve/Reject workflow
- **Real-time Collaboration**: Comments, notifications, and status updates
- **Advanced Reporting**: Activity status, member performance, and approval aging reports
- **Data Export**: CSV/XLSX export functionality with filtering

### Technical Highlights
- **Security**: JWT authentication, rate limiting, input validation, audit logging
- **Performance**: Caching, database indexing, query optimization
- **Accessibility**: WCAG 2.1 AA compliant interface
- **Testing**: Comprehensive unit, integration, and e2e test coverage
- **CI/CD**: Automated testing, security scanning, and deployment pipeline

## 🏗️ Architecture

### Backend (NestJS)
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport.js
- **API**: RESTful endpoints with OpenAPI documentation
- **Security**: Helmet, rate limiting, input validation

### Frontend (Next.js)
- **Framework**: Next.js 14+ with React 18+
- **Styling**: TailwindCSS with responsive design
- **State Management**: Zustand for lightweight state management
- **UI Components**: Headless UI with accessibility features
- **Charts**: Recharts for data visualization

### Infrastructure
- **Cloud Platform**: Azure (Container Apps, Database for PostgreSQL)
- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Application insights and audit logging

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 20+ LTS (20.11 or higher recommended)
- MySQL 8.0+ or PostgreSQL 14+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd activity-tracker
   ```

2. **Setup Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npm run start:dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb activity_tracker
   
   # Run migrations (auto-sync enabled in development)
   # Database schema will be created automatically
   ```

### Docker Development

```bash
# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=activity_tracker

# JWT
JWT_SECRET=your_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=24h

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/invite` - Invite new user (Admin/PM only)
- `POST /auth/accept-invitation` - Accept invitation
- `POST /auth/create-organization` - Create new organization
- `GET /auth/profile` - Get current user profile

### Activity Endpoints
- `GET /activities` - List activities with filtering
- `POST /activities` - Create new activity
- `GET /activities/:id` - Get activity details
- `PATCH /activities/:id` - Update activity
- `POST /activities/:id/submit` - Submit for approval
- `POST /activities/:id/approve` - Approve activity (PM/Admin)
- `POST /activities/:id/reject` - Reject activity (PM/Admin)
- `DELETE /activities/:id` - Delete activity

### Reporting Endpoints
- `GET /reports/activity-status` - Activity status report
- `GET /reports/member-performance` - Member performance report
- `GET /reports/approval-aging` - Approval aging analysis
- `GET /reports/export/activities/csv` - Export activities as CSV

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Test coverage
npm run test:cov
```

### Frontend Tests
```bash
cd frontend

# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Docker Production
```bash
# Build production image
docker build -t activity-tracker .

# Run production container
docker run -p 3000:3000 -p 3001:3001 activity-tracker
```

### Azure Deployment

1. **Setup Azure Resources**
   - Azure Container Registry
   - Azure Database for PostgreSQL
   - Azure Container Apps

2. **Configure GitHub Secrets**
   - `AZURE_CREDENTIALS`
   - `AZURE_ACR_NAME`
   - `AZURE_RESOURCE_GROUP`

3. **Deploy via GitHub Actions**
   - Push to `develop` branch for staging
   - Push to `main` branch for production

## 👥 User Roles & Permissions

### Admin
- Organization management
- User invitation and role assignment
- Full access to all features
- System configuration

### Project Manager
- Activity approval/rejection
- Team performance reports
- Project oversight
- Member management within projects

### Member
- Create and manage own activities
- Submit activities for approval
- View assigned activities
- Basic reporting access

## 🔒 Security Features

- **Authentication**: JWT-based with secure token handling
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Comprehensive validation and sanitization
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Complete activity trail
- **Security Headers**: Helmet.js implementation
- **HTTPS**: TLS encryption in production
- **Password Security**: bcrypt hashing with salt rounds

## 📊 Monitoring & Analytics

- **Audit Logs**: Complete user action tracking
- **Performance Metrics**: Response time monitoring
- **Error Tracking**: Comprehensive error logging
- **Security Events**: Authentication and authorization monitoring
- **Business Metrics**: Activity completion rates, approval times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Maintain accessibility standards
- Update documentation
- Follow conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

## 🗺️ Roadmap

### Phase 4 (Future Enhancements)
- [ ] Mobile application (React Native)
- [ ] Advanced analytics dashboard
- [ ] Integration with external tools (Slack, Teams)
- [ ] Advanced workflow automation
- [ ] Multi-language support
- [ ] Advanced file attachments
- [ ] Calendar integration
- [ ] Advanced notification system
