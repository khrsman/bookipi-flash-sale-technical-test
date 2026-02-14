# Testing Guide

This covers how to run and work with the test suite for the Flash Sale API. Tests include API endpoints, business logic, and input validation.

## Test Files

```
server/tests/
├── flashSale.test.js      # API endpoint tests
├── service.test.js        # Business logic tests
├── validation.test.js     # Input validation tests
└── sampleData.js          # Test fixtures
```

## Setup

### Install Dependencies

From project root (recommended):

```bash
# Installs all dependencies for client and server (from root)
npm install
```

```bash
cd server
npm install
```

### Start Infrastructure

The unit tests use in-memory MongoDB, so you don't need to start MongoDB. But if you're running integration tests or the API:

```bash
# From project root - start MongoDB & Redis
./docker-manager.sh start-infra
```

The package.json includes these test scripts:

```json
{
  "scripts": {
    "test": "jest --runInBand --detectOpenHandles --forceExit",
    "test:watch": "jest --watch --runInBand",
    "test:coverage": "jest --coverage --runInBand --detectOpenHandles --forceExit",
    "test:verbose": "jest --verbose --runInBand --detectOpenHandles --forceExit"
  }
}
```

## Running Tests

Run all tests:

```bash
npm test
```

You should see something like:

```
PASS  tests/validation.test.js
PASS  tests/service.test.js
PASS  tests/flashSale.test.js

Test Suites: 3 passed, 3 total
Tests:       55 passed, 55 total
```

Check code coverage:

```bash
npm run test:coverage
```

Coverage report shows:

```
------------------------|---------|----------|---------|---------|
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
controllers/            |   91.3  |     100  |     100 |   91.3  |
services/               |   96.15 |    95.83 |      80 |   96.15 |
middleware/             |   88.88 |     92.3 |   66.66 |   87.5  |
models/                 |     100 |      100 |     100 |     100 |
------------------------|---------|----------|---------|---------|
```

Run specific test files:

```bash
npm test -- flashSale.test.js
npm test -- service.test.js
npm test -- validation.test.js
```

Watch mode for development (tests re-run on file changes):

```bash
npm run test:watch
```

Verbose output (shows each test case):

```bash
npm run test:verbose
```

## What's Tested

### API Endpoints (flashSale.test.js)

**POST /api/flash-sale/create**

- Creating a flash sale with valid data
- Validation errors (missing fields, negative stock, etc.)
- Time validation (start before end)

**GET /api/flash-sale/status**

- Returns correct status (upcoming, active, sold_out, ended)
- Real-time stock from Redis
- Handles missing flash sale

**POST /api/flash-sale/purchase**

- Successful purchase flow
- Duplicate purchase prevention
- Time checks (not started, already ended)
- Stock validation (sold out)
- Concurrent purchases (race conditions)

**GET /api/flash-sale/check-purchase/:userIdentifier**

- Returns purchase history for user
- Handles various identifier formats

### Service Layer (service.test.js)

Tests for FlashSaleService methods:

- Flash sale creation with Redis initialization
- Status calculation based on time and stock
- Purchase logic with atomic operations
- User purchase verification

### Validation (validation.test.js)

Input validation tests:

- Required field checks
- Data type validation
- Business rule enforcement
- User identifier format

## Using Sample Data

The `sampleData.js` file has pre-made test data you can use:

```javascript
const samples = require('./tests/sampleData');

// Standard flash sale
samples.createFlashSale.standard;

// Starts immediately
samples.createFlashSale.immediate;

// Limited stock (5 items)
samples.createFlashSale.limited;

// Different user identifiers
samples.purchase.email;
samples.purchase.username;

// Invalid data for error testing
samples.invalid.createFlashSale.negativeStock;
```

## Manual Testing with cURL

### Create a Flash Sale

```bash
curl -X POST http://localhost:3000/api/flash-sale/create \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Limited Edition Sneakers",
    "totalStock": 100,
    "startTime": "2026-02-12T10:00:00.000Z",
    "endTime": "2026-02-13T10:00:00.000Z"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "productName": "Limited Edition Sneakers",
    "totalStock": 100,
    "remainingStock": 100,
    "status": "upcoming"
  }
}
```

### Get Status

```bash
curl http://localhost:3000/api/flash-sale/status
```

### Make a Purchase

```bash
curl -X POST http://localhost:3000/api/flash-sale/purchase \
  -H "Content-Type: application/json" \
  -d '{"userIdentifier": "john@example.com"}'
```

Possible responses:

- Success: `"Purchase successful!"`
- Already purchased: `"You have already purchased this item"`
- Sold out: `"Item sold out"`

### Check Purchase Status

```bash
curl http://localhost:3000/api/flash-sale/check-purchase/john@example.com
```

Response shows if user has purchased and when:

```json
{
  "success": true,
  "data": {
    "hasPurchased": true,
    "purchaseTime": "2026-02-12T09:30:00.000Z"
  }
}
```

## Postman Testing

Import the included `Flash_Sale_API.postman_collection.json` file into Postman.

Set up environment variables:

```json
{
  "baseUrl": "http://localhost:3000",
  "productName": "Limited Edition Item",
  "totalStock": 100,
  "startTime": "2026-02-12T10:00:00.000Z",
  "endTime": "2026-02-13T10:00:00.000Z",
  "userIdentifier": "test@example.com"
}
```

The collection includes:

- All 4 main endpoints
- Error test cases (missing fields, negative stock, invalid time range)

## Load Testing

If you want to test concurrent purchases (race conditions), use Artillery:

```bash
npm install -g artillery
```

Create `load-test.yml`:

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 10
      arrivalRate: 50
scenarios:
  - name: 'Purchase attempts'
    flow:
      - post:
          url: '/api/flash-sale/purchase'
          json:
            userIdentifier: 'user_{{ $randomString() }}'
```

Run it:

```bash
artillery run load-test.yml
```

This simulates 50 users/second trying to purchase for 10 seconds.

## Common Issues

**Tests timing out**

Increase the timeout (already set to 30s in package.json):

```json
{
  "jest": {
    "testTimeout": 30000
  }
}
```

**MongoDB connection errors**

Make sure mongodb-memory-server is installed:

```bash
npm install --save-dev mongodb-memory-server
```

Note: First run downloads MongoDB binaries, so it'll be slower.

**Redis connection errors**

Redis must be running for tests to work:

```bash
# Check if Redis is up
redis-cli ping

# Start Redis if needed
redis-server
```

**Open handles warning**

The test scripts already include `--detectOpenHandles --forceExit` flags. If you still see warnings, it's usually fine - just means some connections didn't close cleanly.

## Tips

Run tests before committing:

```bash
npm test && git commit -m "your message"
```

Keep coverage above 80% - check with:

```bash
npm run test:coverage
```

Use watch mode during development - tests auto-run when you save files:

```bash
npm run test:watch
```

## CI/CD Integration

Example GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd server
          npm install

      - name: Run tests
        run: |
          cd server
          npm test

      - name: Coverage report
        run: |
          cd server
          npm run test:coverage
```

## Notes

- Tests use an in-memory MongoDB instance (no need for local MongoDB)
- Redis must be running on localhost:6379
- Each test runs in isolation with fresh database state
- Concurrent purchase tests verify that Lua scripts properly handle race conditions
- The system supports only a single flash sale at a time (not multiple concurrent sales)
