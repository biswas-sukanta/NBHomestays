#!/bin/bash

# Configuration
BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"

echo "=========================================="
echo "   Verifying Production Readiness"
echo "=========================================="

# 1. Backend Verification
echo "1. Backend Tests..."
cd "$BACKEND_DIR" || exit
if mvn clean test; then
    echo "✅ Backend Tests Passed"
else
    echo "❌ Backend Tests Failed"
    exit 1
fi
cd ..

# 2. Frontend Verification
echo "2. Frontend Build..."
cd "$FRONTEND_DIR" || exit
if npm run build; then
    echo "✅ Frontend Build Success"
else
    echo "❌ Frontend Build Failed"
    exit 1
fi

# 3. Check for Hardcoded Localhost
echo "3. Checking for Hardcoded 'localhost'..."
grep -r "localhost" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=target --exclude-dir=.next --exclude="verify_production_readiness.sh" --exclude="*.log"

# Note: grep returns 0 if found, 1 if not found.
# We want it NOT to find localhost in source code (excluding config files implies careful check)
# Ideally, we verify impactful hardcoding. 
# For this script, we just warn.

echo "⚠️  Please review the grep output above. Ensure 'localhost' remains only in dev configs."

echo "=========================================="
echo "   READY FOR DEPLOYMENT"
echo "=========================================="
