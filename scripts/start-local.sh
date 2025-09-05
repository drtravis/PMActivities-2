#!/bin/bash

# Activity Tracker - Local Development Startup Script
# This script sets up the complete local development environment

set -e  # Exit on any error

echo "🚀 Starting PMActivities2 Local Development Environment"
echo "=================================================="

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

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.local ]; then
        print_status "Copying .env.local to .env"
        cp .env.local .env
        print_success "Environment file created"
    else
        print_warning "No .env.local file found. Creating basic .env file"
        cat > .env << EOF
NODE_ENV=development
BACKEND_PORT=3001
FRONTEND_PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=app_user
DB_PASSWORD=app_password123
DB_NAME=PMActivity2
NEXT_PUBLIC_API_URL=http://localhost:3001/api
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
EOF
        print_success "Basic .env file created"
    fi
fi

# Start MySQL with Docker Compose
print_status "Starting MySQL database..."
docker-compose -f docker-compose.local.yml up -d mysql

# Wait for MySQL to be ready
print_status "Waiting for MySQL to be ready..."
sleep 10

# Check if MySQL is accessible
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker exec pmactivities2-mysql mysql -u app_user -papp_password123 -e "SELECT 1;" > /dev/null 2>&1; then
        print_success "MySQL is ready!"
        break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "MySQL failed to start after $max_attempts attempts"
        exit 1
    fi
    
    print_status "Attempt $attempt/$max_attempts - MySQL not ready yet, waiting..."
    sleep 2
    ((attempt++))
done

# Start phpMyAdmin (optional)
print_status "Starting phpMyAdmin..."
docker-compose -f docker-compose.local.yml up -d phpmyadmin

print_success "Database services are running!"
echo ""
echo "📊 Database Access Information:"
echo "   MySQL Host: localhost:3306"
echo "   Database: PMActivity2"
echo "   Username: app_user"
echo "   Password: app_password123"
echo "   phpMyAdmin: http://localhost:8080"
echo ""

# Install backend dependencies if needed
if [ -d "activity-tracker/backend" ]; then
    print_status "Checking backend dependencies..."
    cd activity-tracker/backend
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
        print_success "Backend dependencies installed"
    else
        print_status "Backend dependencies already installed"
    fi
    
    cd ../..
fi

# Install frontend dependencies if needed
if [ -d "activity-tracker/frontend" ]; then
    print_status "Checking frontend dependencies..."
    cd activity-tracker/frontend
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
        print_success "Frontend dependencies installed"
    else
        print_status "Frontend dependencies already installed"
    fi
    
    cd ../..
fi

echo ""
print_success "🎉 Local development environment is ready!"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start the backend: cd activity-tracker/backend && npm run start:dev"
echo "   2. Start the frontend: cd activity-tracker/frontend && npm run dev"
echo "   3. Open your browser: http://localhost:3000"
echo ""
echo "🛠️  Useful Commands:"
echo "   • Stop services: docker-compose -f docker-compose.local.yml down"
echo "   • View logs: docker-compose -f docker-compose.local.yml logs -f"
echo "   • Reset database: docker-compose -f docker-compose.local.yml down -v"
echo ""
echo "📚 Documentation:"
echo "   • API Documentation: http://localhost:3001/api-docs (when backend is running)"
echo "   • Database Admin: http://localhost:8080"
echo ""
