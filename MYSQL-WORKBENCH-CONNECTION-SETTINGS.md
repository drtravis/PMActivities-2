# MySQL Workbench Connection Settings - PMActivities2

## 🔧 **Corrected Connection Settings**

Based on your MySQL Workbench screenshot, here are the **correct connection settings** for PMActivities2:

### **Primary Connection (Application User)**
```
Connection Name: PMActivities2 Local
Connection Method: Standard (TCP/IP)
Hostname: localhost
Port: 3306
Username: app_user
Password: app_password123
Default Schema: PMActivity2
```

### **Root Connection (Admin Access)**
```
Connection Name: PMActivities2 Root
Connection Method: Standard (TCP/IP)
Hostname: localhost
Port: 3306
Username: root
Password: Jairam123!
Default Schema: PMActivity2
```

### **Read-Only Connection (Reporting)**
```
Connection Name: PMActivities2 Reports
Connection Method: Standard (TCP/IP)
Hostname: localhost
Port: 3306
Username: report_user
Password: report_password123
Default Schema: PMActivity2
```

## 🎯 **Step-by-Step Setup in MySQL Workbench**

### **1. Create New Connection**
1. Open MySQL Workbench
2. Click the "+" icon next to "MySQL Connections"
3. Enter connection details from above

### **2. Test Connection**
1. Click "Test Connection" button
2. Should show "Successfully made the MySQL connection"
3. Click "OK" to save

### **3. Connect to Database**
1. Double-click the connection
2. You should see the PMActivity2 schema in the left panel

## 📊 **What You'll See After Connection**

### **Database Schema: PMActivity2**
Once connected, you'll see these tables:

#### **Core Application Tables:**
- `organizations` - Multi-tenant organization data
- `users` - User accounts with role-based access
- `projects` - Project management
- `activities` - Activity tracking with approval workflow
- `tasks` - Task management with status tracking
- `boards` - Personal task boards (Monday.com style)
- `comments` - Activity and task comments
- `audit_logs` - Comprehensive audit trail
- `status_configuration` - Customizable status workflows

#### **Relationship Tables:**
- `activity_assignees` - Many-to-many activity assignments
- `project_members` - Project membership relationships
- `approvals` - Approval workflow tracking
- `task_history` - Task change history
- `task_comments` - Task-specific comments
- `task_attachments` - File attachments for tasks

## 🔍 **Connection Troubleshooting**

### **If Connection Fails:**

1. **Verify Docker Container is Running:**
```bash
docker ps | grep pmactivities2-mysql
```

2. **Check MySQL Container Logs:**
```bash
docker logs pmactivities2-mysql
```

3. **Test Direct Connection:**
```bash
# Test app_user connection
mysql -h localhost -P 3306 -u app_user -papp_password123 PMActivity2

# Test root connection
mysql -h localhost -P 3306 -u root -p'Jairam123!' PMActivity2
```

4. **Restart MySQL Container:**
```bash
docker-compose -f docker-compose.local.yml restart mysql
```

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| **Connection refused** | Start Docker container: `./scripts/setup-pmactivity2.sh` |
| **Access denied** | Check username/password combination |
| **Database not found** | Ensure PMActivity2 database exists |
| **Port 3306 busy** | Check if another MySQL instance is running |

## 🚀 **Quick Setup Commands**

### **Start PMActivities2 Database:**
```bash
# Linux/macOS
./scripts/setup-pmactivity2.sh

# Windows
scripts\setup-pmactivity2.bat
```

### **Verify Database is Ready:**
```bash
docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "USE PMActivity2; SHOW TABLES;"
```

### **Access phpMyAdmin (Alternative):**
- URL: http://localhost:8080
- Username: app_user
- Password: app_password123
- Database: PMActivity2

## 🔐 **Security Notes**

### **Password Security:**
- **Root Password**: `Jairam123!` (Admin access)
- **App Password**: `app_password123` (Application access)
- **Report Password**: `report_password123` (Read-only access)

### **User Privileges:**
- **root**: Full MySQL server access
- **app_user**: Full access to PMActivity2 database only
- **report_user**: SELECT access to PMActivity2 database only

## 📝 **Connection Strings for Other Tools**

### **Standard MySQL Connection String:**
```
mysql://app_user:app_password123@localhost:3306/PMActivity2
```

### **Root Connection String:**
```
mysql://root:Jairam123!@localhost:3306/PMActivity2
```

### **JDBC URL:**
```
jdbc:mysql://localhost:3306/PMActivity2?user=app_user&password=app_password123
```

### **Node.js Connection (TypeORM):**
```javascript
{
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'app_user',
  password: 'app_password123',
  database: 'PMActivity2'
}
```

## 🎉 **Ready to Connect!**

Your MySQL Workbench should now successfully connect to the PMActivity2 database using the corrected password `Jairam123!` for root access.

### **Access Points Summary:**
- **MySQL Workbench**: Use connection settings above
- **phpMyAdmin**: http://localhost:8080
- **Command Line**: `mysql -h localhost -u app_user -papp_password123 PMActivity2`
- **Application**: Connects automatically via TypeORM

**All configuration files have been updated with the correct root password!** 🔧✅
