@echo off
REM Activity Tracker - Local Development Startup Script for Windows
REM This script sets up the complete local development environment

echo 🚀 Starting PMActivities2 Local Development Environment
echo ==================================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

echo [SUCCESS] Docker is running

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] docker-compose is not installed. Please install docker-compose and try again.
    pause
    exit /b 1
)

REM Copy environment file if it doesn't exist
if not exist .env (
    if exist .env.local (
        echo [INFO] Copying .env.local to .env
        copy .env.local .env
        echo [SUCCESS] Environment file created
    ) else (
        echo [WARNING] No .env.local file found. Creating basic .env file
        (
            echo NODE_ENV=development
            echo BACKEND_PORT=3001
            echo FRONTEND_PORT=3000
            echo DB_HOST=localhost
            echo DB_PORT=3306
            echo DB_USERNAME=app_user
            echo DB_PASSWORD=app_password123
            echo DB_NAME=PMActivity2
            echo NEXT_PUBLIC_API_URL=http://localhost:3001/api
            echo JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
        ) > .env
        echo [SUCCESS] Basic .env file created
    )
)

REM Start MySQL with Docker Compose
echo [INFO] Starting MySQL database...
docker-compose -f docker-compose.local.yml up -d mysql

REM Wait for MySQL to be ready
echo [INFO] Waiting for MySQL to be ready...
timeout /t 10 /nobreak >nul

REM Check if MySQL is accessible
set /a attempt=1
set /a max_attempts=30

:check_mysql
docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] MySQL is ready!
    goto mysql_ready
)

if %attempt% geq %max_attempts% (
    echo [ERROR] MySQL failed to start after %max_attempts% attempts
    pause
    exit /b 1
)

echo [INFO] Attempt %attempt%/%max_attempts% - MySQL not ready yet, waiting...
timeout /t 2 /nobreak >nul
set /a attempt+=1
goto check_mysql

:mysql_ready

REM Start phpMyAdmin (optional)
echo [INFO] Starting phpMyAdmin...
docker-compose -f docker-compose.local.yml up -d phpmyadmin

echo [SUCCESS] Database services are running!
echo.
echo 📊 Database Access Information:
echo    MySQL Host: localhost:3306
echo    Database: PMActivity2
echo    Username: app_user
echo    Password: app_password123
echo    phpMyAdmin: http://localhost:8080
echo.

REM Install backend dependencies if needed
if exist "activity-tracker\backend" (
    echo [INFO] Checking backend dependencies...
    cd activity-tracker\backend
    
    if not exist "node_modules" (
        echo [INFO] Installing backend dependencies...
        npm install
        echo [SUCCESS] Backend dependencies installed
    ) else (
        echo [INFO] Backend dependencies already installed
    )
    
    cd ..\..
)

REM Install frontend dependencies if needed
if exist "activity-tracker\frontend" (
    echo [INFO] Checking frontend dependencies...
    cd activity-tracker\frontend
    
    if not exist "node_modules" (
        echo [INFO] Installing frontend dependencies...
        npm install
        echo [SUCCESS] Frontend dependencies installed
    ) else (
        echo [INFO] Frontend dependencies already installed
    )
    
    cd ..\..
)

echo.
echo [SUCCESS] 🎉 Local development environment is ready!
echo.
echo 🚀 Next Steps:
echo    1. Start the backend: cd activity-tracker\backend ^&^& npm run start:dev
echo    2. Start the frontend: cd activity-tracker\frontend ^&^& npm run dev
echo    3. Open your browser: http://localhost:3000
echo.
echo 🛠️  Useful Commands:
echo    • Stop services: docker-compose -f docker-compose.local.yml down
echo    • View logs: docker-compose -f docker-compose.local.yml logs -f
echo    • Reset database: docker-compose -f docker-compose.local.yml down -v
echo.
echo 📚 Documentation:
echo    • API Documentation: http://localhost:3001/api-docs (when backend is running)
echo    • Database Admin: http://localhost:8080
echo.

pause
