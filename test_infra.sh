#!/bin/bash
echo "Starting Infrastructure Validation..."

# 0. Spin up Docker
echo "Spinning up Docker Containers..."
docker compose up -d
echo "Waiting 10s for containers to initialize..."
sleep 10


# 1. Check if Docker Containers are running
if [ "$(docker ps -q -f name=nbh-postgres)" ]; then
    echo "[PASS] Postgres Container is running"
else
    echo "[FAIL] Postgres Container is NOT running"
    exit 1
fi

if [ "$(docker ps -q -f name=nbh-redis)" ]; then
    echo "[PASS] Redis Container is running"
else
    echo "[FAIL] Redis Container is NOT running"
    exit 1
fi

# 2. Check Postgres Extensions
# Wait a bit for Postgres to be ready if it just started
echo "Waiting for Postgres to be ready..."
sleep 5

EXTENSIONS=$(docker exec nbh-postgres psql -U admin -d nbh_db -c "SELECT extname FROM pg_extension;")

if [[ $EXTENSIONS == *"postgis"* ]]; then
    echo "[PASS] PostGIS extension enabled"
else
    echo "[FAIL] PostGIS extension MISSING"
fi

if [[ $EXTENSIONS == *"pg_trgm"* ]]; then
    echo "[PASS] pg_trgm extension enabled"
else
    echo "[FAIL] pg_trgm extension MISSING"
fi

echo "Validation Complete."
