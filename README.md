# Flash Sale System - Technical Test

High-throughput flash sale system built with MERN stack (MongoDB, Express, React, Next.js) and Redis.

**Developer:** Kaharisman Ramdhani

---

## Table of Contents

- [System Design Overview](#system-design-overview)
- [System Architecture](#system-architecture)
- [Design Decisions](#design-decisions)
- [Cloud Services Architecture](#cloud-services-architecture)
- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Stress Testing](#stress-testing)
- [API Documentation](#api-documentation)
- [Complete API Reference](API_DOCUMENTATION.md)

---

## System Design Overview

This flash sale system implements a **dual-layer protection architecture** designed to handle high-concurrency scenarios while preventing overselling. The system combines the speed of Redis (in-memory cache) with the durability of MongoDB (persistent database) to ensure both performance and data integrity.

**Key Design Highlights:**

- **Redis Layer:** Atomic operations using Lua scripts for instant stock validation
- **MongoDB Layer:** Transaction-based persistence for purchase records and audit trail
- **Concurrent Request Handling:** Supports 10,000+ simultaneous users with 500 req/sec peak load
- **Zero Overselling Guarantee:** Dual validation ensures stock never goes negative
- **Sub-100ms Response Time:** 95th percentile at 23.8ms under peak load

**📐 Complete System Design Diagrams:**

Visual architecture diagrams are available in the repository as Excalidraw files:

- `systemDesign.excalidraw` - Complete system design and architecture

**View Online:** [Open in Excalidraw](https://excalidraw.com/#json=owohsa05k2v6-YU_vupYO,BgQl8d8_4kB0dcdtK6MQ9Q)

<img src="SystemDesign.png" alt="System Design" width="600">

---

## System Architecture

The system uses a dual-layer protection mechanism to prevent overselling during high-traffic flash sales:

1. **Redis Layer** - Fast atomic operations for stock checking and decrementing
2. **MongoDB Layer** - Persistent storage with transaction support for purchase records

### Architecture Diagrams

- `purchase-sequence-flow.excalidraw` - Complete purchase flow with both protection layers
- `dual-layer-protection-flow.excalidraw` - Detailed view of the dual-layer validation mechanism

### System Components

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Next.js   │─────▶│   Express    │─────▶│   MongoDB   │
│  Frontend   │      │   Backend    │      │  (Mongoose) │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            │
                     ┌──────▼──────┐
                     │    Redis    │
                     │   (Cache)   │
                     └─────────────┘
```

---

## Design Decisions

### 1) Redis for the purchase decision (prevents overselling)

The hardest part of a flash sale is the “everyone clicks at once” moment. I use Redis as the gatekeeper for the hot path because it can do atomic operations quickly and avoids race conditions that would oversell stock.

### 2) Lua script to make the purchase check truly atomic

A purchase needs multiple checks (stock > 0, user hasn’t bought yet) and then an update. Doing that with separate calls creates a race window, so I run the whole sequence inside a Redis Lua script as a single atomic operation.

### 3) MongoDB for durability (audit/history), not for the hot path

MongoDB stores flash sale configuration and successful purchase records so we can review what happened after the sale. Transactions are available for all-or-nothing updates, but they add overhead—so the high-contention decision stays in Redis, while MongoDB acts as the durable source for purchase history.

### 4) Polling instead of WebSockets (simple demo UI)

For this take-home demo, polling every 3 seconds is enough to show status/stock changes without adding the extra complexity of managing WebSocket connections and scaling them. If needed truly real-time updates (auctions/live bidding), WebSockets would be a better fit.

### 5) No RabbitMQ/message queue (kept scope focused)

A message queue is great for background work (emails, analytics, order fulfillment), but the core requirement here is an instant success/fail purchase decision. Adding RabbitMQ would introduce more infrastructure and operational overhead (brokers, consumers, retries/DLQ) without improving the critical path for this scope.

### 6) `useState` for frontend state (no global store)

The UI state is small and mostly local (sale data, form input, loading, message). Using React `useState` keeps the frontend straightforward and dependency-light; a global store (Zustand/Redux) only becomes useful once state is shared across many unrelated components.

---

## Cloud Services Architecture

### Local Development with Production Patterns

This project follows cloud-native architecture principles while using Docker containers to simulate production cloud services locally.

**Services Mocked Locally:**

1. **Redis (Distributed Cache)**
   - **Production:** AWS ElastiCache, Azure Cache for Redis, Google Cloud Memorystore
   - **Local:** Redis 7.0 in Docker container
   - **Why:** Identical API and behavior; seamless migration to managed service

2. **MongoDB (Database)**
   - **Production:** MongoDB Atlas, AWS DocumentDB, Azure Cosmos DB
   - **Local:** MongoDB in Docker container
   - **Why:** No code changes needed; just update connection string

3. **Container Orchestration**
   - **Production:** Kubernetes (EKS/GKE/AKS), AWS ECS, Azure Container Instances
   - **Local:** Docker Compose
   - **Why:** Same containerized approach; easy deployment to cloud

**Benefits of This Approach:**

✅ **Zero Cloud Dependency** - Run entire stack on local machine  
✅ **Cost Effective** - No cloud bills during development  
✅ **Fast Iteration** - No network latency to cloud services  
✅ **Easy Testing** - Full control over data and state  
✅ **Production Parity** - Same technology stack as production  
✅ **Simple Onboarding** - New developers run one command

**Additional Cloud Services for Scale:**

- **Message Queue (RabbitMQ/SQS):** For async order processing
- **CDN (CloudFront):** For static asset delivery
- **API Gateway:** Rate limiting and authentication

---

## Quick Start

### Option 1: Docker (Recommended for Testing)

Everything runs in containers - zero local dependencies needed.

```bash
# Start all services
./docker-manager.sh start

# Check status
./docker-manager.sh status

# View logs
./docker-manager.sh logs

# Access application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# Admin:    http://localhost:3000/admin
```

**Note:** First build takes 5-10 minutes. Environment variables are pre-configured.

### Option 2: Local Development

Run infra in Docker, apps locally for faster iteration.

```bash
# 1. Start MongoDB and Redis
./docker-manager.sh start-infra

# 2. Install dependencies server and client (from root)
npm install

# 3. Start dev server and client (from root)
npm run dev
```

**Auto-restart:** The `predev` script automatically clears ports before starting.

### Application access

Main application:

- **URL:** http://localhost:3000

Admin interface for testing / adding flash sale product:

- **URL:** http://localhost:3000/admin

---

## Running Tests

### Unit Tests

Backend service and controller tests:

```bash
cd server
npm test
```

**Coverage:**

- `flashSaleService.test.js` - Core business logic
- `validation.test.js` - Input validation middleware

### API Tests

Postman collection included:

```bash
# Import this file into Postman
server/tests/Flash_Sale_API.postman_collection.json
```

**Endpoints tested:**

- Create flash sale
- Get status
- Attempt purchase
- Check user purchase
- Rate limiting scenarios

## Stress Testing

Artillery-based load testing to validate system performance under high concurrency.

**Quick Start:**
Install dependencies

```bash
# install stress test dependencies
cd server/stress-tests && npm install
```

Create a test flash sale:

```bash
# modify the start and end time
curl -X POST http://localhost:5000/api/flash-sale/create \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Stress Test Product",
    "totalStock": 100,
    "startTime": "2026-02-14T00:00:00Z",
    "endTime": "2026-02-14T23:59:59Z"
  }'
```

Run load test

```bash
# Run moderate test
npm run test

# or Run extreme test
npm run test:extreme
```

**Test Results (Feb 14, 2026):**

- **Load:** 10,000 concurrent users, 500 req/sec peak
- **Response Time (p95):** 23.8ms (target: <150ms)
- **Response Time (p99):** 61ms (target: <300ms)
- **Success Rate:** 100% (97,560 requests)
- **Data Integrity:** 200/200 purchases, no overselling

**Documentation:**

- [LOAD_TESTING_DOCUMENTATION.md](LOAD_TESTING_DOCUMENTATION.md) - Complete test report with detailed analysis
- [server/stress-tests/README.md](server/stress-tests/README.md) - Quick start guide and troubleshooting

See the documentation links above for complete setup instructions, test scenarios, success criteria, and troubleshooting.

---

## API Documentation

📘 **[Complete API Reference](API_DOCUMENTATION.md)** - Detailed documentation with all endpoints, request/response examples, and cURL commands.

### Quick Reference

### Create Flash Sale

```http
POST /api/flash-sale/create
Content-Type: application/json

{
  "productName": "Limited Edition Shoes",
  "totalStock": 100,
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T12:00:00Z"
}
```

### Get Status

```http
GET /api/flash-sale/status
```

### Attempt Purchase

```http
POST /api/flash-sale/purchase
Content-Type: application/json

{
  "userIdentifier": "user@example.com"
}
```

### Check Purchase

```http
GET /api/flash-sale/check-purchase/:userIdentifier
```

---

## Environment Variables

### Backend (server/.env)

```bash
PORT=5000
MONGODB_URI=mongodb://khrsman:K4h4r1sm4n@localhost:27017/flash_sale_db?authSource=admin
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

### Frontend (client/.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/flash-sale
```

**Note:** Demo credentials included for easy setup. In production, use secrets management.

---

## Admin Panel

Simple admin interface for testing:

**URL:** http://localhost:3000/admin

**Features:**

- Create flash sale (only one at a time)
- View active sales
- Reset all data (DB + Redis)

**Limitation:** Only one active flash sale allowed. Reset before creating new one.

---

## Tech Stack

- **Frontend:** Next.js 14, React, TailwindCSS, Axios
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB (with transactions)
- **Cache:** Redis (atomic operations + Lua scripts)
- **Testing:** Jest, Artillery
- **DevOps:** Docker, Docker Compose

---

## Project Structure

```
bookipi-flash-sale-technical-test/
├── .eslintrc.cjs              # ESLint configuration
├── .prettierrc.json           # Prettier configuration
├── .prettierignore            # Prettier ignore rules
├── .eslintignore              # ESLint ignore rules
├── .gitignore                 # Git ignore rules
├── package.json               # Root package manager
├── docker-compose.yml         # Full stack Docker setup
├── docker-manager.sh          # Helper script for Docker
├── demo.sh                    # Demo automation script
├── README.md                  # Main documentation
├── API_DOCUMENTATION.md       # Complete API reference
├── DEMO_GUIDE.md              # Demo walkthrough guide
├── purchase-sequence-flow.excalidraw    # Purchase flow diagram
├── dual-layer-protection-flow.excalidraw # Protection mechanism diagram
│
├── client/                    # Next.js 14 frontend (App Router)
│   ├── .env.example           # Environment variables template
│   ├── .env.local             # Local environment config
│   ├── .dockerignore          # Docker ignore rules
│   ├── Dockerfile             # Client container config
│   ├── package.json           # Frontend dependencies
│   ├── next.config.ts         # Next.js configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── postcss.config.mjs     # PostCSS for Tailwind
│   ├── next-env.d.ts          # Next.js TypeScript definitions
│   ├── README.md              # Client-specific docs
│   │
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout component
│   │   ├── page.tsx           # Home page (flash sale view)
│   │   ├── globals.css        # Global styles
│   │   ├── favicon.ico        # Site favicon
│   │   └── admin/             # Admin dashboard
│   │       └── page.tsx       # Admin page component
│   │
│   ├── components/            # React components
│   │   ├── FlashSaleCard.tsx  # Main flash sale UI
│   │   └── CountdownTimer.tsx # Countdown timer component
│   │
│   ├── services/              # API integration layer
│   │   └── api.ts             # API client & type definitions
│   │
│   └── public/                # Static assets
│       ├── file.svg
│       ├── globe.svg
│       ├── next.svg
│       ├── vercel.svg
│       └── window.svg
│
└── server/                    # Express.js backend
    ├── .env                   # Environment variables (do not commit)
    ├── .env.example           # Environment template
    ├── .dockerignore          # Docker ignore rules
    ├── Dockerfile             # Server container config
    ├── package.json           # Backend dependencies
    ├── app.js                 # Express app setup
    │
    ├── bin/
    │   └── www                # Server startup script
    │
    ├── config/                # Configuration files
    │   ├── db.js              # MongoDB connection
    │   └── redis.js           # Redis connection
    │
    ├── controllers/           # Request handlers
    │   ├── flashSaleController.js  # Flash sale endpoints
    │   └── adminController.js      # Admin endpoints
    │
    ├── middleware/            # Express middleware
    │   └── validation.js      # Request validation
    │
    ├── models/                # Mongoose models
    │   ├── index.js           # Model exports
    │   ├── FlashSale.js       # Flash sale schema
    │   └── Purchase.js        # Purchase schema
    │
    ├── routes/                # Route definitions
    │   ├── flashSale.js       # Flash sale routes
    │   └── admin.js           # Admin routes
    │
    ├── services/              # Business logic layer
    │   └── flashSaleService.js     # Core flash sale logic
    │
    ├── utils/                 # Helper utilities
    │   └── luaScripts.js      # Redis Lua scripts
    │
    ├── scripts/               # Utility scripts (empty)
    │
    ├── tests/                 # Jest test suite
    │   ├── README.md          # Testing documentation
    │   ├── INDEX.md           # Test index
    │   ├── flashSale.test.js  # API integration tests
    │   ├── service.test.js    # Service layer tests
    │   ├── validation.test.js # Validation tests
    │   ├── sampleData.js      # Test fixtures
    │   └── Flash_Sale_API.postman_collection.json
    │
    └── stress-tests/          # Load testing with Artillery
        ├── package.json       # Artillery dependencies
        ├── artillery.yml      # Load test scenarios
        ├── processors.js      # Custom Artillery processors
        ├── report.json        # Latest test report
        └── README.md          # Stress testing guide
```

---

## Development Notes

### Port Conflicts

If you get "port already in use" errors:

```bash
# Ports are auto-cleared by predev script
npm run dev

# Or manually:
lsof -ti:5000,3000 | xargs kill -9
```

### Debugging

```bash
# Backend logs
cd server && npm run dev

# Frontend logs
cd client && npm run dev

# Docker logs
docker-compose logs -f backend
```

### Resetting Data

```bash
# Via admin panel (easiest)
http://localhost:3000/admin -> Click "Reset All Data"

# Via Docker
docker-compose down -v  # Removes volumes
docker-compose up -d
```

---

## Known Limitations

1. **Single flash sale only** - No multi-product support yet
2. **No authentication** - Uses email/username only (demo simplification)
3. **No payment integration** - Purchase simulation only
4. **Polling for updates** - Could use WebSocket for real-time updates
5. **No purchase history** - Users can't view past purchases (admin only)

---

## Interview Questions & Answers

**Q: Why Redis instead of just MongoDB?**

A: Redis provides atomic operations (DECR) that prevent race conditions. MongoDB alone would require complex locking or optimistic concurrency patterns, increasing latency and complexity.

**Q: What happens if Redis crashes?**

A: System would fail to accept new purchases (fail-safe). On restart, Redis is rehydrated from MongoDB. Production would use Redis Cluster with persistence (AOF/RDB).

**Q: How do you prevent duplicate purchases?**

A: Compound unique index on user + flash sale in MongoDB. Even if Redis allows through, MongoDB transaction will fail with duplicate key error.

**Q: Can this scale horizontally?**

A: Backend can scale with load balancer. Need Redis Cluster (not single instance) and MongoDB replica set for production horizontal scaling.

**Q: Why Lua scripts instead of transactions?**

A: Redis doesn't have transactions like SQL. Lua scripts execute atomically and are ~2x faster than MULTI/EXEC for our use case.

**Q: Why use Docker instead of managed cloud services?**

A: This follows the project requirement to mock cloud services locally. Docker provides identical behavior to managed services (Redis/MongoDB) while eliminating cloud costs and dependencies during development. Production deployment would simply swap connection strings to AWS ElastiCache and MongoDB Atlas with zero code changes. This demonstrates cloud-native architecture without requiring live cloud infrastructure.

**Q: How would you deploy this to production?**

A: Multiple approaches:

1. **Kubernetes (EKS/GKE/AKS):** Deploy existing Docker containers with managed Redis/MongoDB
2. **Serverless:** Migrate to AWS Lambda + API Gateway with ElastiCache and DocumentDB
3. **PaaS:** Deploy to Heroku/Railway with add-ons for Redis and MongoDB
4. **Traditional VMs:** EC2/Compute Engine with auto-scaling groups

All require minimal changes - mainly environment variables and connection strings. The dual-layer architecture remains identical.

---

## License

MIT License - For technical assessment purposes.

---

## Contact

Kaharisman Ramdhani
Repository: https://github.com/[your-username]/bookipi-flash-sale-technical-test
