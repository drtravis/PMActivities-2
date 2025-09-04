#!/bin/bash

# Deploy complete backend server to Azure Container Apps
echo "Deploying complete backend server..."

# Update container app with complete server
az containerapp update \
  --name activity-tracker-backend \
  --resource-group activity-tracker-rg \
  --yaml - <<EOF
properties:
  template:
    containers:
    - name: activity-tracker-backend
      image: node:18-alpine
      resources:
        cpu: 0.5
        memory: 1Gi
      env:
      - name: NODE_ENV
        value: production
      - name: DB_HOST
        value: activity-tracker-mysql.mysql.database.azure.com
      - name: DB_PORT
        value: "3306"
      - name: DB_USERNAME
        value: drtravi
      - name: DB_PASSWORD
        value: ActivityTracker2024!
      - name: DB_NAME
        value: activity_tracker
      - name: JWT_SECRET
        value: super-secret-jwt-key-for-production-2024
      - name: JWT_EXPIRES_IN
        value: 24h
      - name: CORS_ORIGIN
        value: https://activity-tracker-frontend.mangoground-80e673e8.canadacentral.azurecontainerapps.io
      command:
      - sh
      - -c
      - |
        cd /app
        wget -O server.js https://raw.githubusercontent.com/drtravis/PActivities/main/activity-tracker/backend/production-server-complete.js
        npm install express mysql2 jsonwebtoken bcrypt
        node server.js
EOF

echo "Deployment complete!"
