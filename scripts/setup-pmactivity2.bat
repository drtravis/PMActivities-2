@echo off
REM PMActivity2 Database Setup Script for Windows
REM This script sets up the PMActivity2 database and ensures clean migration

echo 🗄️ Setting up PMActivity2 Database
echo ==================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

echo [SUCCESS] Docker is running

REM Stop existing containers if running
echo [INFO] Stopping existing containers...
docker-compose -f docker-compose.local.yml down >nul 2>&1

REM Remove old volumes to ensure clean start
echo [INFO] Removing old database volumes for clean setup...
docker volume rm pmactivities2_mysql_data >nul 2>&1
docker volume prune -f >nul 2>&1

REM Start MySQL with new PMActivity2 database
echo [INFO] Starting MySQL with PMActivity2 database...
docker-compose -f docker-compose.local.yml up -d mysql

REM Wait for MySQL to be ready
echo [INFO] Waiting for MySQL to initialize PMActivity2 database...
timeout /t 15 /nobreak >nul

REM Check if MySQL is accessible and PMActivity2 database exists
set /a attempt=1
set /a max_attempts=30

:check_pmactivity2
docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "USE PMActivity2; SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] PMActivity2 database is ready!
    goto pmactivity2_ready
)

if %attempt% geq %max_attempts% (
    echo [ERROR] PMActivity2 database failed to initialize after %max_attempts% attempts
    echo [INFO] Checking MySQL logs...
    docker-compose -f docker-compose.local.yml logs mysql
    pause
    exit /b 1
)

echo [INFO] Attempt %attempt%/%max_attempts% - PMActivity2 database not ready yet, waiting...
timeout /t 2 /nobreak >nul
set /a attempt+=1
goto check_pmactivity2

:pmactivity2_ready

REM Verify database structure
echo [INFO] Verifying PMActivity2 database setup...
docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "USE PMActivity2; SHOW TABLES; SELECT 'Database PMActivity2 is ready for TypeORM synchronization' AS status;"

REM Start phpMyAdmin
echo [INFO] Starting phpMyAdmin for database management...
docker-compose -f docker-compose.local.yml up -d phpmyadmin

echo [SUCCESS] 🎉 PMActivity2 database setup complete!
echo.
echo 📊 Database Information:
echo    Database Name: PMActivity2
echo    MySQL Host: localhost:3306
echo    Username: app_user
echo    Password: app_password123
echo    Root Password: Jairam123!
echo    phpMyAdmin: http://localhost:8080
echo.
echo 🚀 Next Steps:
echo    1. Start the backend: cd activity-tracker\backend ^&^& npm run start:dev
echo    2. TypeORM will automatically create tables in PMActivity2
echo    3. Start the frontend: cd activity-tracker\frontend ^&^& npm run dev
echo    4. Access the application: http://localhost:3000
echo.
echo 🔧 Database Management:
echo    • View in phpMyAdmin: http://localhost:8080
echo    • Connect directly: mysql -h localhost -u app_user -p PMActivity2
echo    • Reset database: docker-compose -f docker-compose.local.yml down -v
echo.

REM Optional: Show current Docker containers
echo [INFO] Current running containers:
docker-compose -f docker-compose.local.yml ps

pause
