# Azure Deployment Guide for PMActivities

## Prerequisites
- Azure subscription
- Azure CLI installed (optional)
- MySQL Workbench or similar tool for database setup

## Step 1: Create Azure Database for MySQL

1. **Create MySQL Flexible Server**
   - Resource Group: `PMActivities-RG`
   - Server Name: `pmactivities-mysql-server`
   - Region: Choose your preferred region
   - MySQL Version: 8.0
   - Compute: Burstable B1ms (1 vCore, 2GB RAM)
   - Admin Username: `pmadmin`
   - Password: Create a strong password

2. **Configure Networking**
   - Allow public access from Azure services: ✅
   - Add your current IP address: ✅

3. **Create Database**
   ```sql
   CREATE DATABASE pmactivities;
   USE pmactivities;
   -- Run your database schema/migrations here
   ```

## Step 2: Create Backend App Service

1. **Create App Service**
   - Resource Group: `PMActivities-RG`
   - Name: `pmactivities-backend`
   - Runtime: Node 18 LTS
   - OS: Linux
   - Region: Same as database
   - Plan: Basic B1

2. **Configure Environment Variables**
   Go to Configuration → Application Settings and add:
   ```
   NODE_ENV=production
   PORT=8080
   DB_TYPE=mysql
   DB_HOST=pmactivities-mysql-server.mysql.database.azure.com
   DB_PORT=3306
   DB_USERNAME=pmadmin
   DB_PASSWORD=[your-mysql-password]
   DB_NAME=pmactivities
   JWT_SECRET=[generate-strong-secret-key]
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

## Step 3: Create Frontend App Service

1. **Create App Service**
   - Resource Group: `PMActivities-RG`
   - Name: `pmactivities-frontend`
   - Runtime: Node 18 LTS
   - OS: Linux
   - Region: Same as backend
   - Plan: Use existing

2. **Configure Environment Variables**
   ```
   NODE_ENV=production
   PORT=8080
   NEXT_PUBLIC_API_URL=https://pmactivities-backend.azurewebsites.net/api
   NEXT_TELEMETRY_DISABLED=1
   ```

## Step 4: Deploy Applications

### Backend Deployment
1. Zip the `activity-tracker/backend` folder
2. Go to App Service → Deployment Center
3. Choose "Local Git" or "ZIP Deploy"
4. Upload the backend.zip file

### Frontend Deployment
1. Zip the `activity-tracker/frontend` folder
2. Go to App Service → Deployment Center
3. Upload the frontend.zip file

## Step 5: Configure Custom Domain (Optional)

1. Purchase domain or use existing
2. Add custom domain to App Service
3. Configure DNS CNAME record
4. Enable SSL certificate

## Step 6: Final Configuration

1. **Test the applications**
   - Backend: https://pmactivities-backend.azurewebsites.net/api/health
   - Frontend: https://pmactivities-frontend.azurewebsites.net

2. **Update CORS if needed**
   - Add your custom domain to CORS_ORIGIN

3. **Monitor logs**
   - Use App Service logs and Application Insights

## Environment Variables Summary

### Backend (.env.production)
- NODE_ENV=production
- PORT=8080
- DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME
- JWT_SECRET
- CORS_ORIGIN
- Email configuration
- File upload settings

### Frontend (.env.production)
- NODE_ENV=production
- PORT=8080
- NEXT_PUBLIC_API_URL

## Security Checklist
- [ ] Strong JWT secret generated
- [ ] Database firewall configured
- [ ] SSL certificates enabled
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database credentials secured

## Troubleshooting
- Check App Service logs for errors
- Verify environment variables are set
- Test database connectivity
- Ensure CORS is configured correctly
- Check file upload permissions
