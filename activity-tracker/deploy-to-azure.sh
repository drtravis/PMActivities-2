#!/bin/bash

# Azure Deployment Script for PMActivities
# This script helps prepare the application for Azure deployment

echo "🚀 Preparing PMActivities for Azure Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the activity-tracker directory"
    exit 1
fi

print_status "Starting deployment preparation..."

# 1. Clean and install backend dependencies
echo "📦 Preparing backend..."
cd backend
if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_status "Cleaned backend node_modules"
fi

npm ci
if [ $? -eq 0 ]; then
    print_status "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi

# Build backend
npm run build
if [ $? -eq 0 ]; then
    print_status "Backend built successfully"
else
    print_error "Failed to build backend"
    exit 1
fi

cd ..

# 2. Clean and install frontend dependencies
echo "📦 Preparing frontend..."
cd frontend
if [ -d "node_modules" ]; then
    rm -rf node_modules
    print_status "Cleaned frontend node_modules"
fi

if [ -d ".next" ]; then
    rm -rf .next
    print_status "Cleaned frontend .next directory"
fi

npm ci
if [ $? -eq 0 ]; then
    print_status "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend
npm run build
if [ $? -eq 0 ]; then
    print_status "Frontend built successfully"
else
    print_error "Failed to build frontend"
    exit 1
fi

cd ..

# 3. Create deployment packages
echo "📦 Creating deployment packages..."

# Create backend deployment package
if [ -f "backend-azure.zip" ]; then
    rm backend-azure.zip
fi

cd backend
zip -r ../backend-azure.zip . -x "node_modules/*" "*.log" "*.env*" ".git/*"
cd ..
print_status "Backend deployment package created: backend-azure.zip"

# Create frontend deployment package
if [ -f "frontend-azure.zip" ]; then
    rm frontend-azure.zip
fi

cd frontend
zip -r ../frontend-azure.zip . -x "node_modules/*" "*.log" "*.env*" ".git/*"
cd ..
print_status "Frontend deployment package created: frontend-azure.zip"

# 4. Create validation script package
echo "📦 Preparing validation tools..."
if [ -f "validation-tools.zip" ]; then
    rm validation-tools.zip
fi

zip -r validation-tools.zip validate-deployment.js AZURE_TROUBLESHOOTING_GUIDE.md package.json -x "node_modules/*"
print_status "Validation tools package created: validation-tools.zip"

# 5. Display next steps
echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Create Azure Database for MySQL"
echo "2. Create Backend App Service (Node 18 LTS)"
echo "3. Create Frontend App Service (Node 18 LTS)"
echo "4. Configure environment variables (see .env.azure)"
echo "5. Deploy backend-azure.zip to backend App Service"
echo "6. Deploy frontend-azure.zip to frontend App Service"
echo "7. Run validation: node validate-deployment.js"
echo ""
echo "📖 Documentation:"
echo "  - AZURE_DEPLOYMENT_GUIDE.md - Complete deployment guide"
echo "  - AZURE_DEPLOYMENT_CHECKLIST.md - Step-by-step checklist"
echo "  - AZURE_TROUBLESHOOTING_GUIDE.md - Problem solving guide"
echo ""
print_warning "IMPORTANT: Update all placeholder values in .env.azure with your actual Azure resource names!"
print_warning "After deployment, run: node validate-deployment.js to test connectivity"

echo "✨ Ready for Azure deployment!"
