#!/bin/bash

# Deployment Script for North Bengal Homestays

echo "🚀 Starting Deployment Process..."

# 1. Backend Build
echo "📦 Building Backend..."
cd backend
./mvnw clean package -DskipTests
cd ..

# 2. Frontend Build
echo "📦 Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 3. Docker Composition
echo "🐳 Starting Docker Services..."
docker-compose down
docker-compose up -d --build

echo "✅ Deployment Complete!"
echo "➡️  Frontend: http://localhost:3000"
echo "➡️  Backend: http://localhost:8080"
echo "➡️  Maildev: http://localhost:1080"
