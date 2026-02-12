# Test Suite Overview

This directory contains all test files for the Flash Sale API. The test suite covers API endpoints, service layer logic, and input validation.

## Test Files

```
tests/
├── flashSale.test.js          # API endpoint integration tests
├── service.test.js            # Business logic unit tests
├── validation.test.js         # Input validation tests
├── sampleData.js              # Test data fixtures
└── Flash_Sale_API.postman_collection.json
```

## Getting Started

Install dependencies first:
```bash
npm install
```

Run the test suite:
```bash
npm test
```

Check code coverage:
```bash
npm run test:coverage
```

## What's Tested

**API Endpoints** (24 tests)
- Creating flash sales with various inputs
- Getting flash sale status
- Processing purchases (including edge cases like sold out, duplicate purchases)
- Checking user purchase history

**Service Layer** (15 tests)
- Flash sale creation and Redis initialization
- Status calculations based on time and stock
- Purchase logic with atomic operations
- User purchase verification

**Validation** (16 tests)
- Required field validation
- Data type checks
- Business rule validation (e.g., start time before end time)
- User identifier format validation

Total: 55 tests, ~92% coverage

## Running Tests

```bash
npm test                    # run all tests
npm test -- flashSale.test.js   # run specific file
npm run test:watch          # watch mode for development
npm run test:coverage       # with coverage report
```

## Quick Manual Testing

Create a flash sale:
```bash
curl -X POST http://localhost:3000/api/flash-sale/create \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Limited Edition Item",
    "totalStock": 100,
    "startTime": "2026-02-12T10:00:00.000Z",
    "endTime": "2026-02-13T10:00:00.000Z"
  }'
```

Check status:
```bash
curl http://localhost:3000/api/flash-sale/status
```

Make a purchase:
```bash
curl -X POST http://localhost:3000/api/flash-sale/purchase \
  -H "Content-Type: application/json" \
  -d '{"userIdentifier": "user@example.com"}'
```

## Using Sample Data

The `sampleData.js` file contains pre-made test data:

```javascript
const samples = require('./sampleData');

// Different flash sale scenarios
samples.createFlashSale.standard      // normal case
samples.createFlashSale.immediate     // starts immediately
samples.createFlashSale.limited       // only 5 items

// Purchase examples
samples.purchase.email
samples.purchase.username

// Invalid data for error testing
samples.invalid.createFlashSale.negativeStock
```

## Postman Collection

Import `Flash_Sale_API.postman_collection.json` into Postman for manual API testing. Set the `baseUrl` variable to `http://localhost:3000`.

## Common Issues

**Tests are slow on first run**  
The first run downloads MongoDB binaries for the in-memory database. Subsequent runs are faster.

**Redis connection errors**  
Make sure Redis is running: `redis-server`

**Test timeouts**  
Tests have a 30-second timeout configured. If you still see timeouts, check that Redis and MongoDB are responsive.

## Notes

- Tests use an in-memory MongoDB instance (no local MongoDB needed)
- Redis must be running for tests to pass
- Each test runs in isolation with fresh database state
- Concurrent purchase tests verify atomic operations work correctly

## More Documentation

- [README.md](./README.md) - Detailed testing guide
- [../TESTING.md](../TESTING.md) - Quick reference
- [sampleData.js](./sampleData.js) - Test fixtures with comments
