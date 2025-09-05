# Azure Environment Variables Configuration

## 🔧 Backend App Service Environment Variables

Copy these to your **Backend App Service** → **Configuration** → **Application Settings**:

```bash
# Core Configuration
NODE_ENV=production
PORT=8080

# Database Configuration (Azure Database for MySQL)
# ⚠️ REPLACE with your actual MySQL server details
DB_TYPE=mysql
DB_HOST=YOUR-MYSQL-SERVER.mysql.database.azure.com
DB_PORT=3306
DB_USERNAME=YOUR-MYSQL-ADMIN-USER
DB_PASSWORD=YOUR-MYSQL-PASSWORD
DB_NAME=pmactivities
DB_SSL=true

# JWT Configuration
# ⚠️ GENERATE a new secure secret for production
JWT_SECRET=YOUR-SUPER-SECURE-JWT-SECRET-MINIMUM-32-CHARACTERS-LONG
JWT_EXPIRES_IN=7d

# CORS Configuration (CRITICAL for frontend connectivity)
# ⚠️ REPLACE with your actual frontend URL(s)
CORS_ORIGIN=https://YOUR-FRONTEND-APP.azurewebsites.net
FRONTEND_URL=https://YOUR-FRONTEND-APP.azurewebsites.net

# File Upload Configuration
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760

# Email Configuration (Optional)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM_NAME=PMActivities
EMAIL_FROM_ADDRESS=noreply@your-domain.com

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=86400000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined
LOG_FILE_ENABLED=true

# Azure-specific
WEBSITE_NODE_DEFAULT_VERSION=18.17.0
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

## 🌐 Frontend App Service Environment Variables

Copy these to your **Frontend App Service** → **Configuration** → **Application Settings**:

```bash
# Core Configuration
NODE_ENV=production
PORT=8080

# API Configuration (CRITICAL for backend connectivity)
# ⚠️ REPLACE with your actual backend URL
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-APP.azurewebsites.net/api

# Build Configuration
NEXT_TELEMETRY_DISABLED=1

# Azure-specific
WEBSITE_NODE_DEFAULT_VERSION=18.17.0
```

## 🔍 How to Set Environment Variables in Azure

### Method 1: Azure Portal (Recommended)
1. Go to **Azure Portal** → **App Services**
2. Select your **Backend** or **Frontend** App Service
3. Go to **Configuration** → **Application settings**
4. Click **+ New application setting**
5. Add **Name** and **Value** for each variable
6. Click **Save** and **Continue**
7. **Restart** the App Service

### Method 2: Azure CLI
```bash
# Set backend environment variables
az webapp config appsettings set \
  --resource-group YOUR-RESOURCE-GROUP \
  --name YOUR-BACKEND-APP \
  --settings \
    NODE_ENV=production \
    DB_HOST=YOUR-MYSQL-SERVER.mysql.database.azure.com \
    CORS_ORIGIN=https://YOUR-FRONTEND-APP.azurewebsites.net

# Set frontend environment variables
az webapp config appsettings set \
  --resource-group YOUR-RESOURCE-GROUP \
  --name YOUR-FRONTEND-APP \
  --settings \
    NODE_ENV=production \
    NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-APP.azurewebsites.net/api
```

## ⚠️ Critical Replacements Required

### 1. Database Configuration
Replace these placeholders:
- `YOUR-MYSQL-SERVER` → Your actual Azure MySQL server name
- `YOUR-MYSQL-ADMIN-USER` → Your MySQL admin username
- `YOUR-MYSQL-PASSWORD` → Your MySQL admin password

### 2. App Service URLs
Replace these placeholders:
- `YOUR-BACKEND-APP` → Your actual backend App Service name
- `YOUR-FRONTEND-APP` → Your actual frontend App Service name

### 3. Security Keys
- `JWT_SECRET` → Generate a new 32+ character random string
- Email credentials → Your actual email service credentials

## 🧪 Testing Environment Variables

After setting variables, test them:

### Backend Test:
```bash
# Check health endpoint
curl https://YOUR-BACKEND-APP.azurewebsites.net/health

# Should show environment details
```

### Frontend Test:
```bash
# Open browser console on your frontend
# Check for API URL in network requests
```

## 🔧 Common Issues & Solutions

### Issue: "CORS Error"
**Solution:** Ensure `CORS_ORIGIN` in backend matches your frontend URL exactly

### Issue: "Database Connection Failed"
**Solution:** 
1. Check database firewall allows Azure services
2. Verify DB_HOST, DB_USERNAME, DB_PASSWORD are correct
3. Ensure DB_SSL=true for Azure MySQL

### Issue: "Environment Variable Not Found"
**Solution:**
1. Restart App Service after setting variables
2. Check variable names are exact (case-sensitive)
3. For frontend: ensure variables start with `NEXT_PUBLIC_`

### Issue: "JWT Secret Error"
**Solution:** Generate a new secure JWT_SECRET (minimum 32 characters)

## 📋 Validation Checklist

After setting all variables:
- [ ] Restart both App Services
- [ ] Test backend health endpoint
- [ ] Test frontend loads without errors
- [ ] Check browser console for API connectivity
- [ ] Run validation script: `node validate-deployment.js`

## 🔐 Security Best Practices

1. **Never commit secrets to Git**
2. **Use strong, unique passwords**
3. **Generate new JWT secrets for production**
4. **Limit CORS origins to your actual domains**
5. **Enable SSL/HTTPS for all services**
6. **Regularly rotate passwords and secrets**

## 📞 Need Help?

If you encounter issues:
1. Check **AZURE_TROUBLESHOOTING_GUIDE.md**
2. Review App Service logs in Azure Portal
3. Test each component individually
4. Use the validation script to identify problems
