#!/bin/bash

# Database Setup Script for Development
# This script sets up the PostgreSQL database using Docker and runs initial migrations

set -e

echo "Setting up PostgreSQL database for development..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ".env file created. Please review and update it if needed."
fi

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    if [ $counter -ge $timeout ]; then
        echo "PostgreSQL failed to start within $timeout seconds"
        docker-compose logs postgres
        exit 1
    fi
    counter=$((counter + 1))
    sleep 1
done

echo "PostgreSQL is ready!"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema (for initial setup)
echo "Pushing database schema..."
npx prisma db push

echo "Database setup complete!"
echo ""
echo "Available commands:"
echo "  npm run db:studio    - Open Prisma Studio"
echo "  npm run db:migrate   - Create and apply a new migration"
echo "  npm run db:push      - Push schema changes to database"
echo "  npm run db:down      - Stop PostgreSQL container"
echo ""
echo "Database URL: postgresql://postgres:postgres@localhost:5432/everinbox_dev"
