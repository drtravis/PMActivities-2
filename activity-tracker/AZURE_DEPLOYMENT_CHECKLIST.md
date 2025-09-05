# Azure Deployment Checklist

## ✅ Pre-Deployment Preparation (COMPLETED)

- [x] Created `.env.azure` with production environment variables
- [x] Created `.env.production` files for backend and frontend
- [x] Updated `package.json` files with Azure-compatible scripts
- [x] Updated `web.config` files for IIS deployment
- [x] Created `database-schema.sql` for easy database setup
- [x] Created deployment script `deploy-to-azure.sh`
- [x] Created comprehensive deployment guide

## 🔧 Azure Resources to Create

### Database
- [ ] Create Azure Database for MySQL Flexible Server
  - [ ] Server name: `pmactivities-mysql-server`
  - [ ] Admin username: `pmadmin`
  - [ ] Strong password created
  - [ ] Allow Azure services access
  - [ ] Add your IP to firewall
  - [ ] Run `database-schema.sql` to create tables

### Backend App Service
- [ ] Create App Service for backend
  - [ ] Name: `pmactivities-backend`
  - [ ] Runtime: Node 18 LTS
  - [ ] OS: Linux
  - [ ] Plan: Basic B1 or higher
  - [ ] Configure all environment variables from `.env.production`

### Frontend App Service
- [ ] Create App Service for frontend
  - [ ] Name: `pmactivities-frontend`
  - [ ] Runtime: Node 18 LTS
  - [ ] OS: Linux
  - [ ] Same plan as backend
  - [ ] Configure environment variables

## 📦 Deployment Steps

- [ ] Run `./deploy-to-azure.sh` to create deployment packages
- [ ] Deploy `backend-azure.zip` to backend App Service
- [ ] Deploy `frontend-azure.zip` to frontend App Service
- [ ] Verify both applications start successfully

## 🔐 Environment Variables to Configure

### Backend App Service Configuration
```
NODE_ENV=production
PORT=8080
DB_TYPE=mysql
DB_HOST=pmactivities-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_USERNAME=pmadmin
DB_PASSWORD=[your-mysql-password]
DB_NAME=pmactivities
JWT_SECRET=[generate-strong-secret]
CORS_ORIGIN=https://pmactivities-frontend.azurewebsites.net
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[your-email]
SMTP_PASS=[your-app-password]
EMAIL_FROM_NAME=PMActivities
EMAIL_FROM_ADDRESS=noreply@your-domain.com
LOG_LEVEL=info
BCRYPT_ROUNDS=12
```

### Frontend App Service Configuration
```
NODE_ENV=production
PORT=8080
NEXT_PUBLIC_API_URL=https://pmactivities-backend.azurewebsites.net/api
NEXT_TELEMETRY_DISABLED=1
```

## 🧪 Testing

- [ ] Test backend health endpoint: `https://pmactivities-backend.azurewebsites.net/api/health`
- [ ] Test frontend loads: `https://pmactivities-frontend.azurewebsites.net`
- [ ] Test login functionality
- [ ] Test database connectivity
- [ ] Test file uploads
- [ ] Test email functionality (if configured)

## 🔒 Security

- [ ] SSL certificates enabled on both App Services
- [ ] Database firewall configured properly
- [ ] Strong JWT secret generated
- [ ] Environment variables secured
- [ ] CORS configured correctly

## 🌐 Optional: Custom Domain

- [ ] Purchase/configure custom domain
- [ ] Add custom domain to App Services
- [ ] Configure DNS records
- [ ] Update CORS_ORIGIN with custom domain
- [ ] Enable SSL for custom domain

## 📊 Monitoring

- [ ] Enable Application Insights
- [ ] Configure log streaming
- [ ] Set up alerts for errors
- [ ] Monitor performance metrics

## 🚀 Go Live

- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Team notified

## 📞 Support Information

- **Backend URL**: https://pmactivities-backend.azurewebsites.net
- **Frontend URL**: https://pmactivities-frontend.azurewebsites.net
- **Database**: pmactivities-mysql-server.mysql.database.azure.com
- **Default Admin**: admin@pmactivities.com / Admin123!
- **Default PMO**: pmo@pmactivities.com / PMO123!

---

**Note**: Remember to update all placeholder values (like server names, passwords, etc.) with your actual Azure resource information!
