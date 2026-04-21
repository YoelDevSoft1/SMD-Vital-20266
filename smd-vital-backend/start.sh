#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Ensuring production seed data..."
node dist/scripts/ensure-production-seed.js

echo "Starting server..."
exec node dist/index.js
