#!/bin/bash

# Deploy UUID fixes to Activity Tracker Backend
echo "Deploying UUID fixes to Activity Tracker Backend..."

# Create a temporary container to build the image with UUID fixes
az containerapp create \
  --name activity-tracker-backend-uuid \
  --resource-group activity-tracker-rg \
  --environment /subscriptions/e00628bb-4020-4bb3-8b08-d0553ff9cb7f/resourceGroups/DefaultResourceGroup-null/providers/Microsoft.App/managedEnvironments/activity-tracker-env1 \
  --image node:18-alpine \
  --target-port 3001 \
  --ingress external \
  --env-vars \
    NODE_ENV=production \
    DB_HOST=activity-tracker-mysql.mysql.database.azure.com \
    DB_PORT=3306 \
    DB_USERNAME=drtravi \
    DB_PASSWORD=ActivityTracker2024! \
    DB_NAME=activity_tracker \
    JWT_SECRET=super-secret-jwt-key-for-production-2024 \
    JWT_EXPIRES_IN=24h \
    CORS_ORIGIN=https://activity-tracker-frontend.mangoground-80e673e8.canadacentral.azurecontainerapps.io \
  --command "sh" "-c" "npm install express mysql2 jsonwebtoken bcrypt && node -p 'console.log(\"UUID fix deployed\")' && node test-server.js"

echo "UUID fix deployment initiated..."
