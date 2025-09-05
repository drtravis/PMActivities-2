# 🔧 AZURE ENVIRONMENT VARIABLES CONFIGURATION

## 📋 **BACKEND CONTAINER APP ENVIRONMENT VARIABLES**

### **Required Variables (Set these in Azure Portal)**

```bash
# Application Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=pmactivities-mysql-server.mysql.database.azure.com
DB_PORT=3306
DB_USERNAME=pmadmin
DB_PASSWORD=[YOUR_MYSQL_PASSWORD_HERE]
DB_DATABASE=pmactivity2

# Security Configuration
JWT_SECRET=[GENERATE_STRONG_SECRET_KEY]
CORS_ORIGIN=[YOUR_FRONTEND_URL_HERE]

# Example Values:
# JWT_SECRET=pmactivities2024_super_secret_key_change_in_production_xyz123
# CORS_ORIGIN=https://pmactivities-frontend.azurestaticapps.net
```

### **How to Set Backend Environment Variables:**

1. Go to Azure Portal → Container Apps
2. Find your backend container app: `pmactivities-backend`
3. Click **"Environment variables"** in left menu
4. Click **"+ Add"** for each variable above
5. Click **"Save"**
6. Click **"Create new revision"** to apply changes

---

## 🌐 **FRONTEND STATIC WEB APP ENVIRONMENT VARIABLES**

### **Required Variables (Set these in Azure Portal)**

```bash
# API Configuration
NEXT_PUBLIC_API_URL=[YOUR_BACKEND_URL_HERE]
NEXT_PUBLIC_APP_NAME=PM Activities 2

# Example Values:
# NEXT_PUBLIC_API_URL=https://pmactivities-backend.azurecontainerapps.io
```

### **How to Set Frontend Environment Variables:**

1. Go to Azure Portal → Static Web Apps
2. Find your frontend static web app: `pmactivities-frontend`
3. Click **"Environment variables"** in left menu
4. Click **"+ Add"** for each variable above
5. Click **"Save"**

---

## 🔐 **SECURITY NOTES**

### **JWT Secret Generation:**
Generate a strong JWT secret using one of these methods:

**Option 1: Online Generator**
- Go to: https://generate-secret.vercel.app/32
- Copy the generated secret

**Option 2: Command Line**
```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows PowerShell
[System.Web.Security.Membership]::GeneratePassword(32, 0)
```

**Option 3: Node.js**
```javascript
require('crypto').randomBytes(32).toString('hex')
```

### **Database Password:**
- Use the password you created when setting up Azure MySQL server
- Make sure it's strong and secure
- Don't share it in code or documentation

---

## 🔗 **URL MAPPING**

After deployment, update these URLs:

### **Backend URL Format:**
```
https://[container-app-name].azurecontainerapps.io
Example: https://pmactivities-backend.azurecontainerapps.io
```

### **Frontend URL Format:**
```
https://[static-web-app-name].azurestaticapps.net
Example: https://pmactivities-frontend.azurestaticapps.net
```

### **Database URL Format:**
```
[mysql-server-name].mysql.database.azure.com
Example: pmactivities-mysql-server.mysql.database.azure.com
```

---

## ✅ **VERIFICATION CHECKLIST**

After setting environment variables:

### **Backend Verification:**
- [ ] All 8 environment variables are set
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] CORS_ORIGIN matches your frontend URL exactly
- [ ] DB_PASSWORD matches your MySQL password
- [ ] New revision created and deployed

### **Frontend Verification:**
- [ ] NEXT_PUBLIC_API_URL is set correctly
- [ ] URL ends with `.azurecontainerapps.io` (not `.net`)
- [ ] No trailing slash in API URL
- [ ] Environment variables saved

### **Test Endpoints:**
- [ ] Backend health: `https://[backend-url]/health`
- [ ] Frontend loads: `https://[frontend-url]`
- [ ] Login works with test credentials

---

## 🚨 **COMMON MISTAKES TO AVOID**

1. **Wrong CORS Origin:** Make sure it matches frontend URL exactly
2. **Missing HTTPS:** All URLs should use `https://`
3. **Trailing Slashes:** Don't add trailing slashes to API URLs
4. **Wrong Database Name:** Use `pmactivity2` not `PMActivity2`
5. **Weak JWT Secret:** Use at least 32 characters
6. **Wrong Port:** Backend should use port `3001`

---

## 🔄 **UPDATE PROCESS**

When you need to update environment variables:

1. **Backend:** Update variables → Save → Create new revision
2. **Frontend:** Update variables → Save (auto-redeploys)
3. **Wait:** 5-10 minutes for changes to take effect
4. **Test:** Verify endpoints work correctly

---

## 📞 **TROUBLESHOOTING**

**If backend won't start:**
- Check Container App logs for errors
- Verify all environment variables are set
- Test database connection separately

**If frontend shows API errors:**
- Check browser console for CORS errors
- Verify NEXT_PUBLIC_API_URL is correct
- Test backend URL directly in browser

**If database connection fails:**
- Verify MySQL server is running
- Check firewall allows Azure services
- Test connection with MySQL Workbench
