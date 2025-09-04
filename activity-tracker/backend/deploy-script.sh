#!/bin/bash

# Deploy script for Activity Tracker Backend with UUID fixes
# This script creates a new container instance to build and deploy the corrected image

echo "Creating Azure Container Instance for building AMD64 image..."

# Create a container instance that can build Docker images
az container create \
  --resource-group activity-tracker-rg \
  --name build-container \
  --image docker:dind \
  --restart-policy Never \
  --cpu 2 \
  --memory 4 \
  --environment-variables \
    DOCKER_HOST=tcp://localhost:2375 \
  --command-line "/bin/sh -c 'dockerd-entrypoint.sh & sleep 10 && docker build --platform linux/amd64 -t activitytrackeracr.azurecr.io/activity-tracker-backend:v12 . && docker push activitytrackeracr.azurecr.io/activity-tracker-backend:v12'"

echo "Build container created. Waiting for completion..."
