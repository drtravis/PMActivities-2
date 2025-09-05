#!/bin/bash

# PMActivity2 Database Setup Script
# This script sets up the PMActivity2 database and ensures clean migration

set -e  # Exit on any error

echo "🗄️ Setting up PMActivity2 Database"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_success "Docker is running"

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.local.yml down > /dev/null 2>&1 || true

# Remove old volumes to ensure clean start
print_status "Removing old database volumes for clean setup..."
docker volume rm pmactivities2_mysql_data > /dev/null 2>&1 || true
docker volume prune -f > /dev/null 2>&1 || true

# Start MySQL with new PMActivity2 database
print_status "Starting MySQL with PMActivity2 database..."
docker-compose -f docker-compose.local.yml up -d mysql

# Wait for MySQL to be ready
print_status "Waiting for MySQL to initialize PMActivity2 database..."
sleep 15

# Check if MySQL is accessible and PMActivity2 database exists
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "USE PMActivity2; SELECT 1;" > /dev/null 2>&1; then
        print_success "PMActivity2 database is ready!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "PMActivity2 database failed to initialize after $max_attempts attempts"
        print_status "Checking MySQL logs..."
        docker-compose -f docker-compose.local.yml logs mysql
        exit 1
    fi
    
    print_status "Attempt $attempt/$max_attempts - PMActivity2 database not ready yet, waiting..."
    sleep 2
    ((attempt++))
done

# Verify database structure
print_status "Verifying PMActivity2 database setup..."
docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "
USE PMActivity2;
SHOW TABLES;
SELECT 'Database PMActivity2 is ready for TypeORM synchronization' AS status;
"

# Start phpMyAdmin
print_status "Starting phpMyAdmin for database management..."
docker-compose -f docker-compose.local.yml up -d phpmyadmin

print_success "🎉 PMActivity2 database setup complete!"
echo ""
echo "📊 Database Information:"
echo "   Database Name: PMActivity2"
echo "   MySQL Host: localhost:3306"
echo "   Username: app_user"
echo "   Password: app_password123"
echo "   Root Password: Jairam123!"
echo "   phpMyAdmin: http://localhost:8080"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start the backend: cd activity-tracker/backend && npm run start:dev"
echo "   2. TypeORM will automatically create tables in PMActivity2"
echo "   3. Start the frontend: cd activity-tracker/frontend && npm run dev"
echo "   4. Access the application: http://localhost:3000"
echo ""
echo "🔧 Database Management:"
echo "   • View in phpMyAdmin: http://localhost:8080"
echo "   • Connect directly: mysql -h localhost -u app_user -p PMActivity2"
echo "   • Reset database: docker-compose -f docker-compose.local.yml down -v"
echo ""

# Optional: Show current Docker containers
print_status "Current running containers:"
docker-compose -f docker-compose.local.yml ps
