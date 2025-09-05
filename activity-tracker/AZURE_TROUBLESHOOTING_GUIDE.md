# Azure Deployment Troubleshooting Guide

## 🚨 Common Post-Deployment Issues & Solutions

### 1. Frontend Cannot Connect to Backend

#### Symptoms:
- Frontend loads but shows "Network Error" or "ERR_CONNECTION_REFUSED"
- API calls fail with CORS errors
- Console shows 404 or 500 errors for API calls

#### Solutions:

**A. Check Environment Variables**
```bash
# In Azure Portal → App Service → Configuration
# Verify these are set correctly:

Frontend App Service:
- NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-APP.azurewebsites.net/api

Backend App Service:
- CORS_ORIGIN=https://YOUR-FRONTEND-APP.azurewebsites.net
- FRONTEND_URL=https://YOUR-FRONTEND-APP.azurewebsites.net
```

**B. Test Backend Health**
```bash
# Test if backend is running
curl https://YOUR-BACKEND-APP.azurewebsites.net/health

# Should return:
{
  "status": "ok",
  "message": "PMActivities Backend is running",
  "version": "2.0.0"
}
```

**C. Check CORS Configuration**
- Ensure CORS_ORIGIN includes your frontend URL
- For multiple domains: `CORS_ORIGIN=https://app1.com,https://app2.com`
- Check browser console for CORS errors

### 2. Database Connection Issues

#### Symptoms:
- Backend fails to start
- "Database connection failed" in logs
- 500 errors on API calls

#### Solutions:

**A. Verify Database Configuration**
```bash
# Check these environment variables in Backend App Service:
DB_HOST=your-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_USERNAME=your-admin-user
DB_PASSWORD=your-password
DB_NAME=pmactivities
DB_SSL=true
```

**B. Check Azure MySQL Firewall**
1. Go to Azure Database for MySQL
2. Connection security → Firewall rules
3. Ensure "Allow access to Azure services" is ON
4. Add your IP if testing locally

**C. Test Database Connection**
```sql
-- Connect using MySQL Workbench or command line:
mysql -h your-mysql-server.mysql.database.azure.com -u your-admin-user -p

-- Test connection:
USE pmactivities;
SHOW TABLES;
```

### 3. Environment Variables Not Loading

#### Symptoms:
- App shows default/localhost URLs
- Configuration seems ignored
- "Environment variable not set" errors

#### Solutions:

**A. Restart App Services**
```bash
# After setting environment variables, restart both services:
# Azure Portal → App Service → Restart
```

**B. Check Variable Names**
- Frontend: Must start with `NEXT_PUBLIC_` for client-side access
- Backend: Standard environment variable names
- No spaces in variable names or values

**C. Verify in App Service**
```bash
# Azure Portal → App Service → Configuration → Application settings
# Check that all required variables are present and have correct values
```

### 4. SSL/HTTPS Issues

#### Symptoms:
- Mixed content warnings
- "This site is not secure" messages
- API calls blocked by browser

#### Solutions:

**A. Force HTTPS**
```bash
# Azure Portal → App Service → TLS/SSL settings
# HTTPS Only: On
```

**B. Update All URLs to HTTPS**
- Ensure all environment variables use `https://`
- Check that API calls use HTTPS URLs

### 5. File Upload Issues

#### Symptoms:
- File uploads fail
- "Permission denied" errors
- Files not saved

#### Solutions:

**A. Check Upload Directory**
```bash
# Ensure upload directory exists and is writable
# Azure App Service has limited file system access
```

**B. Consider Azure Blob Storage**
```bash
# For production, use Azure Blob Storage instead of local file system
# Update upload configuration to use blob storage
```

## 🔍 Debugging Tools

### 1. Enable Detailed Logging

**Backend (main.ts):**
```typescript
// Already enhanced with detailed logging
// Check console output in Azure Portal → Log stream
```

**Frontend (browser console):**
```javascript
// Enhanced API client logging is already enabled
// Open browser dev tools → Console tab
```

### 2. Azure Portal Debugging

**Log Stream:**
```bash
# Azure Portal → App Service → Log stream
# Shows real-time application logs
```

**Application Insights:**
```bash
# Azure Portal → Application Insights
# Detailed performance and error tracking
```

### 3. Health Check Endpoints

**Backend Health Check:**
```bash
GET https://YOUR-BACKEND-APP.azurewebsites.net/health

Response:
{
  "status": "ok",
  "environment": "production",
  "database": "configured",
  "corsOrigins": 2
}
```

## 📋 Quick Diagnostic Checklist

### Backend Issues:
- [ ] App Service is running (not stopped)
- [ ] Environment variables are set correctly
- [ ] Database connection string is correct
- [ ] Database firewall allows Azure services
- [ ] CORS origins include frontend URL
- [ ] Health endpoint returns 200 OK

### Frontend Issues:
- [ ] App Service is running
- [ ] NEXT_PUBLIC_API_URL points to backend
- [ ] Backend health check passes
- [ ] No CORS errors in browser console
- [ ] API calls use correct HTTPS URLs

### Database Issues:
- [ ] MySQL server is running
- [ ] Firewall rules allow connections
- [ ] Credentials are correct
- [ ] Database and tables exist
- [ ] SSL is properly configured

## 🛠️ Emergency Recovery Steps

### 1. Backend Won't Start
```bash
# 1. Check logs in Azure Portal
# 2. Verify all environment variables
# 3. Test database connection separately
# 4. Restart App Service
# 5. Redeploy if necessary
```

### 2. Frontend Shows Errors
```bash
# 1. Check browser console for errors
# 2. Verify NEXT_PUBLIC_API_URL is correct
# 3. Test backend health endpoint
# 4. Check CORS configuration
# 5. Clear browser cache and retry
```

### 3. Database Connection Lost
```bash
# 1. Check MySQL server status
# 2. Verify firewall rules
# 3. Test connection from local machine
# 4. Check credentials haven't expired
# 5. Restart database server if needed
```

## 📞 Getting Help

### Log Collection:
1. Azure Portal → App Service → Log stream
2. Browser Console (F12 → Console)
3. Network tab for failed requests
4. Application Insights for detailed metrics

### Common Error Codes:
- **404**: Endpoint not found (check URL)
- **500**: Server error (check backend logs)
- **CORS**: Cross-origin blocked (check CORS config)
- **401**: Authentication failed (check JWT config)
- **Connection refused**: Backend not running

Remember: Most issues are configuration-related. Double-check all environment variables and restart services after changes!
