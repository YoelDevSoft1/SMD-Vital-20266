#!/bin/sh
set -e

# ============================================================================
# Validate required environment variables before doing anything else.
# Failing fast here beats failing during request handling or migrations.
# ============================================================================
missing=""
for v in DATABASE_URL JWT_SECRET JWT_REFRESH_SECRET REDIS_URL; do
  eval "val=\"\${$v:-}\""
  if [ -z "$val" ]; then
    missing="$missing $v"
  fi
done

if [ -n "$missing" ]; then
  echo ""
  echo "FATAL: missing required environment variable(s):$missing"
  echo "       Set them in your .env (local) or Render dashboard (production)."
  echo "       See docs/DEPLOY.md for the full list."
  echo ""
  exit 1
fi

echo "Running database migrations..."
# `prisma` CLI is not in `dependencies` (kept in devDependencies to slim the
# production image). Invoke the binary directly from node_modules, which is
# populated at build time by copying from the builder stage in the Dockerfile.
node ./node_modules/prisma/build/index.js migrate deploy

echo "Ensuring production seed data..."
node dist/scripts/ensure-production-seed.js

echo "Starting server..."
exec node dist/index.js
