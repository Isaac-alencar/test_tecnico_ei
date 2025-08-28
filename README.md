# Everinbox Assessment - Event Tracking Microservice

Event tracking microservice built with Next.js, PostgreSQL, and Prisma for batch event processing and real-time statistics.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for local PostgreSQL)

### Setup
```bash
# Clone and install
git clone <repo-url>
cd everinbox-assessment
npm install

# Setup environment
cp .env.example .env

# Start database
src/scripts/setup-db.sh

# Run seed
npm run db:seed

# Start development server
npm run dev
```

Server runs on http://localhost:3000

## API Endpoints

### Authentication
All API requests require `x-api-key` header with valid API key.

### Core Endpoints
- `POST /api/events` - Batch event ingestion
- `GET /api/stats/daily` - Daily statistics by site
- `GET /api/health` - Full health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe
- `GET /api/metrics` - Service metrics
- `GET /api/info` - Service information

### Example Usage
```bash
# Ingest events
curl -X POST http://localhost:3000/api/events \
  -H "x-api-key: sk_test_123456789" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "id": "evt_001",
        "type": "sent",
        "email": "user@example.com",
        "site": "site-a.com",
        "timestamp": "2024-01-20T10:30:00Z"
      }
    ]
  }'

# Get daily stats
curl -H "x-api-key: sk_test_123456789" \
  http://localhost:3000/api/stats/daily
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test events.test.ts

# Watch mode
npm run test:watch

# Code formatting
npm run format

# Linting
npm run lint
```

Test coverage includes API endpoints, middleware, and error handling scenarios.

## Architecture Decisions

### Tech Stack
- **Next.js 15**: App Router for API routes and frontend
- **PostgreSQL + Prisma**: Database with type-safe ORM
- **Tailwind CSS**: Utility-first styling
- **Vitest**: Fast testing framework
- **React Query**: Data fetching and caching

### Design Choices

#### 1. Batch Processing
Events are validated in bulk before database operations to reduce iterations and improve performance.

#### 2. Simple Authentication
API key validation via environment variables with hardcoded fallback for development simplicity.

#### 3. In-Memory Metrics
Request metrics stored in memory for zero-dependency monitoring. Suitable for single-instance deployments.

#### 4. Structured Logging
JSON-formatted logs with timestamps and context for better observability without external dependencies.

#### 5. Health Check Separation
- **Liveness**: Basic service availability
- **Readiness**: Database connectivity check
- **Full Health**: Complete system status

## Project Structure

```
src/
├── app/api/           # API route handlers
├── lib/               # Shared utilities (auth, metrics, logging)
├── __tests__/         # Test suites
└── middleware.ts      # Request authentication and logging

prisma/
├── schema.prisma      # Database schema
└── migrations/        # Database migrations
```

## Limitations

### Current Trade-offs
- **In-memory metrics**: Lost on restart, no persistence
- **Sequential processing**: Not optimized for very large batches (>1000 events)
- **Single database**: No read replicas or sharding
- **Hardcoded event types**: Limited to `sent`, `open`, `click`, `complaint`
- **Basic auth**: Simple API key, no JWT or advanced auth
- **No rate limiting**: Vulnerable to abuse without external protection

### Scalability Concerns
- Memory metrics don't scale across multiple instances
- Real-time stats calculation degrades with data volume
- No caching layer for frequently accessed data

### Production Requirements
These limitations are acceptable for MVP/assessment context but would need addressing for production:
- Redis for shared metrics and caching
- Queue system for event processing
- Database connection pooling
- Rate limiting and request validation
- Comprehensive monitoring and alerting

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/everinbox_dev"

# Authentication
API_KEYS="sk_test_123456789,sk_dev_abcdefghijk"

# Runtime
NODE_ENV="development"
```

## Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:up           # Start PostgreSQL container
npm run db:down         # Stop PostgreSQL container
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Testing & Code Quality
npm test                # Run tests
npm run lint            # Check code style
npm run format          # Format code
```
