#!/bin/bash
set -e

# Run Prisma migrations before starting the application
npx prisma migrate deploy

# Start the application
exec "$@"
