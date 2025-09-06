# 🚀 COMPLETE AZURE DEPLOYMENT GUIDE - FROM SCRATCH

## 📋 **PREREQUISITES**
- [ ] Azure subscription with billing enabled
- [ ] GitHub account with PMActivities-2 repository
- [ ] MySQL Workbench installed locally
- [ ] Code pushed to GitHub main branch ✅ (Already done)

---

## **STEP 1: CREATE RESOURCE GROUP**

### **1.1 Navigate to Resource Groups**
1. Go to **Azure Portal** (portal.azure.com)
2. Sign in with your Azure account
3. In the search bar, type **"Resource groups"**
4. Click **"Resource groups"** from the results

### **1.2 Create New Resource Group**
1. Click **"+ Create"** button
2. Fill in the details:
   - **Subscription:** Select your subscription
   - **Resource group name:** `pmactivities-rg`
   - **Region:** `East US` (or your preferred region)
3. Click **"Review + create"**
4. Click **"Create"**
5. Wait for deployment to complete (30 seconds)

---

## **STEP 2: CREATE AZURE DATABASE FOR MYSQL**

### **2.1 Navigate to MySQL**
1. In Azure Portal search bar, type **"Azure Database for MySQL"**
2. Click **"Azure Database for MySQL flexible servers"**

### **2.2 Create MySQL Server**
1. Click **"+ Create"**
2. Select **"Flexible server"**
3. Fill in **Basics** tab:
   - **Subscription:** Your subscription
   - **Resource group:** `pmactivities-rg`
   - **Server name:** `activity-tracker-mysql` (standardized server name)
   - **Region:** `East US` (same as resource group)
   - **MySQL version:** `8.0`
   - **Workload type:** `Development`
   - **Compute + storage:** Click **"Configure server"**
     - **Compute tier:** `Burstable`
     - **Compute size:** `Standard_B1ms (1 vCore, 2 GiB RAM)`
     - **Storage size:** `20 GiB`
     - **Storage auto-growth:** `Enabled`
     - Click **"Save"**

### **2.3 Authentication Settings**
1. **Authentication method:** `MySQL authentication only`
2. **Admin username:** `pmadmin`
3. **Password:** Create a strong password (save it securely!)
4. **Confirm password:** Re-enter the password

### **2.4 Networking Settings**
1. Click **"Next: Networking"**
2. **Connectivity method:** `Public access (allowed IP addresses)`
3. **Firewall rules:**
   - Check **"Allow public access from any Azure service within Azure to this server"**
   - Click **"+ Add current client IP address"**
4. Click **"Next: Security"**

### **2.5 Security & Additional Settings**
1. **Security tab:** Leave defaults
2. Click **"Next: Additional settings"**
3. **Additional settings:** Leave defaults
4. Click **"Next: Tags"**
5. **Tags:** Leave empty
6. Click **"Review + create"**
7. Click **"Create"**
8. **Wait 5-10 minutes** for deployment to complete

### **2.6 Get Connection Details**
1. Go to your MySQL server resource
2. In **"Overview"** tab, copy:
   - **Server name:** `pmactivities-mysql-server.mysql.database.azure.com`
   - **Admin username:** `pmadmin`
   - **Password:** (the one you created)

---

## **STEP 3: SETUP DATABASE SCHEMA**

### **3.1 Connect with MySQL Workbench**
1. Open **MySQL Workbench**
2. Click **"+"** to create new connection
3. Fill in connection details:
   - **Connection Name:** `Azure PMActivities`
   - **Hostname:** `pmactivities-mysql-server.mysql.database.azure.com`
   - **Port:** `3306`
   - **Username:** `pmadmin`
   - **Password:** Click **"Store in Keychain"** and enter your password
4. Click **"Test Connection"**
5. If successful, click **"OK"**

### **3.2 Create Database and Tables**
1. Connect to your MySQL server
2. Run this SQL script:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS pmactivity2;
USE pmactivity2;

-- Create status_configurations table if it doesn't exist
CREATE TABLE IF NOT EXISTS status_configurations (
  id VARCHAR(36) PRIMARY KEY,
  type ENUM('task', 'activity', 'approval') NOT NULL,
  name VARCHAR(100) NOT NULL,
  displayName VARCHAR(100),
  color VARCHAR(7) NOT NULL,
  `order` INT NOT NULL DEFAULT 0,
  isDefault BOOLEAN NOT NULL DEFAULT FALSE,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_type_name (type, name)
);

-- Insert default status configurations
INSERT INTO status_configurations (id, type, name, displayName, color, `order`, isDefault, isActive) VALUES
('status-1', 'task', 'To Do', 'To Do', '#6B7280', 1, true, true),
('status-2', 'task', 'In Progress', 'In Progress', '#3B82F6', 2, false, true),
('status-3', 'task', 'In Review', 'In Review', '#F59E0B', 3, false, true),
('status-4', 'task', 'Done', 'Done', '#10B981', 4, false, true)
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- Verify data
SELECT * FROM status_configurations WHERE type = 'task' ORDER BY `order`;
```

3. Verify you see 4 status records

---

## **STEP 4: CREATE CONTAINER APP ENVIRONMENT**

### **4.1 Create Container Apps Environment**
1. In Azure Portal, search **"Container Apps"**
2. Click **"Container Apps"**
3. Click **"+ Create"**
4. Click **"Create Container Apps environment"**
5. Fill in details:
   - **Subscription:** Your subscription
   - **Resource group:** `pmactivities-rg`
   - **Environment name:** `pmactivities-env`
   - **Region:** `East US`
   - **Zone redundancy:** `Disabled`
6. Click **"Next: Monitoring"**
7. **Log Analytics workspace:** `Create new`
   - **Name:** `pmactivities-logs`
8. Click **"Next: Networking"**
9. **Networking:** Leave defaults
10. Click **"Review + create"**
11. Click **"Create"**
12. Wait 3-5 minutes for deployment

---

## **STEP 5: CREATE BACKEND CONTAINER APP**

### **5.1 Create Backend Container App**
1. In Container Apps, click **"+ Create"**
2. **Basics tab:**
   - **Subscription:** Your subscription
   - **Resource group:** `pmactivities-rg`
   - **Container app name:** `pmactivities-backend`
   - **Region:** `East US`
   - **Container Apps Environment:** `pmactivities-env`

### **5.2 Container Configuration**
1. Click **"Next: Container"**
2. **Container settings:**
   - **Name:** `backend`
   - **Image source:** `Docker Hub or other registries`
   - **Image type:** `Public`
   - **Registry login server:** `docker.io`
   - **Image and tag:** `node:18-alpine`
   - **CPU and Memory:** `0.25 CPU cores, 0.5 Gi memory`

### **5.3 Environment Variables**
1. Click **"+ Add"** for each variable:

```bash
NODE_ENV = production
PORT = 3001
DB_HOST = pmactivities-mysql-server.mysql.database.azure.com
DB_PORT = 3306
DB_USERNAME = pmadmin
DB_PASSWORD = [your-mysql-password]
DB_DATABASE = pmactivity2
JWT_SECRET = pmactivities2024_super_secret_key_change_in_production
CORS_ORIGIN = *
```

### **5.4 Ingress Configuration**
1. Click **"Next: Ingress"**
2. **Ingress:** `Enabled`
3. **Ingress traffic:** `Accepting traffic from anywhere`
4. **Ingress type:** `HTTP`
5. **Target port:** `3001`

### **5.5 Complete Backend Creation**
1. Click **"Review + create"**
2. Click **"Create"**
3. Wait 5-10 minutes for deployment
4. **Copy the Application URL** (you'll need this later)

---

## **STEP 6: SETUP GITHUB DEPLOYMENT FOR BACKEND**

### **6.1 Configure GitHub Actions**
1. Go to your Container App **"pmactivities-backend"**
2. Click **"Continuous deployment"** in left menu
3. Click **"GitHub"**
4. **GitHub settings:**
   - **Organization:** Your GitHub username
   - **Repository:** `PMActivities-2`
   - **Branch:** `main`
   - **Dockerfile location:** `activity-tracker/backend/Dockerfile`
   - **Build context:** `activity-tracker/backend`
5. Click **"Start continuous deployment"**
6. Authorize GitHub access if prompted
7. Wait for initial deployment (10-15 minutes)

---

## **STEP 7: CREATE FRONTEND STATIC WEB APP**

### **7.1 Create Static Web App**
1. In Azure Portal, search **"Static Web Apps"**
2. Click **"Static Web Apps"**
3. Click **"+ Create"**
4. **Basics tab:**
   - **Subscription:** Your subscription
   - **Resource group:** `pmactivities-rg`
   - **Name:** `pmactivities-frontend`
   - **Plan type:** `Free`
   - **Region:** `East US 2`
   - **Source:** `GitHub`

### **7.2 GitHub Configuration**
1. Click **"Sign in with GitHub"**
2. Authorize Azure access
3. **GitHub settings:**
   - **Organization:** Your GitHub username
   - **Repository:** `PMActivities-2`
   - **Branch:** `main`
4. **Build Details:**
   - **Build presets:** `Next.js`
   - **App location:** `/activity-tracker/frontend`
   - **Api location:** (leave empty)
   - **Output location:** `out`

### **7.3 Complete Frontend Creation**
1. Click **"Review + create"**
2. Click **"Create"**
3. Wait 10-15 minutes for deployment
4. **Copy the URL** from Overview tab

---

## **STEP 8: CONFIGURE ENVIRONMENT VARIABLES**

### **8.1 Update Backend CORS**
1. Go to **Container App** → **"pmactivities-backend"**
2. Click **"Environment variables"**
3. Find **CORS_ORIGIN** variable
4. Update value to your frontend URL: `https://[your-frontend-url].azurestaticapps.net`
5. Click **"Save"**
6. Click **"Create new revision"**

### **8.2 Configure Frontend Variables**
1. Go to **Static Web App** → **"pmactivities-frontend"**
2. Click **"Environment variables"**
3. Click **"+ Add"**
4. Add these variables:

```bash
NEXT_PUBLIC_API_URL = https://[your-backend-url].azurecontainerapps.io
NEXT_PUBLIC_APP_NAME = PM Activities 2
```

5. Click **"Save"**

---

## **STEP 9: VERIFICATION CHECKLIST**

### **9.1 Test Backend**
- [ ] Go to: `https://[backend-url].azurecontainerapps.io/api/health`
- [ ] Should return: `{"status":"OK"}`

### **9.2 Test Frontend**
- [ ] Go to: `https://[frontend-url].azurestaticapps.net`
- [ ] Login page loads
- [ ] Can login with test credentials
- [ ] Activities page loads
- [ ] Status filtering works

### **9.3 Test Database**
- [ ] MySQL Workbench connects successfully
- [ ] `pmactivity2` database exists
- [ ] `status_configurations` table has 4 records

---

## **🎯 FINAL URLS TO SAVE**

After completion, save these URLs:
- **Frontend:** `https://[name].azurestaticapps.net`
- **Backend:** `https://[name].azurecontainerapps.io`
- **Database:** `[name].mysql.database.azure.com:3306`

---

## **STEP 10: LOCAL CODE CHANGES (IF NEEDED)**

### **10.1 Verify Dockerfile Exists**
Check that these files exist in your repository:

**Backend Dockerfile:** `activity-tracker/backend/Dockerfile`
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

**Frontend Build Configuration:** `activity-tracker/frontend/next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### **10.2 If Files Are Missing, Create Them**

**Create Backend Dockerfile:**
```bash
# In your local repository
cd activity-tracker/backend
# Create Dockerfile with content above
```

**Update Frontend Config:**
```bash
# In your local repository
cd activity-tracker/frontend
# Update next.config.js with content above
```

### **10.3 Push Changes (If Made)**
```bash
git add .
git commit -m "Add deployment configuration files"
git push origin main
```

---

## **🚨 TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions:**

**Backend Won't Start:**
- Check Container App logs: Container App → Log stream
- Verify environment variables are set correctly
- Ensure database connection works

**Frontend Shows API Errors:**
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS_ORIGIN in backend matches frontend URL
- Test backend URL directly in browser

**Database Connection Fails:**
- Verify MySQL server firewall allows Azure services
- Check username/password are correct
- Ensure database `pmactivity2` exists

**GitHub Actions Fail:**
- Check repository permissions
- Verify Dockerfile path is correct
- Check build logs in GitHub Actions tab

---

## **📞 SUPPORT CONTACTS**

If you get stuck:
1. **Azure Support:** Available in Azure Portal
2. **GitHub Issues:** Check repository issues tab
3. **Documentation:** docs.microsoft.com/azure

---

**Total Setup Time:** 45-60 minutes
**Monthly Cost:** ~$20-30 USD (with free tiers)

## **🎉 SUCCESS CRITERIA**

You'll know everything is working when:
- ✅ Frontend loads at your Static Web App URL
- ✅ You can login successfully
- ✅ Activities page shows tasks
- ✅ Status filtering works (To Do, In Progress, In Review, Done)
- ✅ Priority filtering works (High, Medium, Low)
- ✅ Backend API responds at /api/health endpoint

**Ready to deploy! Follow each step carefully and you'll have a working production system.** 🚀
