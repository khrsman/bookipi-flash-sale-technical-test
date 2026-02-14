# Flash Sale - Artillery Load Tests

## What's this?

Artillery config for load testing the flash sale backend. Two test scenarios available:

- **Moderate Test** (`npm run test`): 500 req/sec peak, suitable for initial validation
- **Extreme Test** (`npm run test:extreme`): 1,000 req/sec peak, stress test for breaking point analysis

## Test Setup

Three scenarios running in parallel:

- **Check Status** (40%): `GET /api/flash-sale/status`
- **Attempt Purchase** (50%): `POST /api/flash-sale/purchase`
- **Check Purchase** (10%): `GET /api/flash-sale/check-purchase/user_test@example.com`

**Moderate Test** load profile (7 minutes):

| Phase     | Duration | Users/sec |
| --------- | -------- | --------- |
| Warm up   | 60s      | 50        |
| Ramp up   | 60s      | 200       |
| Peak load | 60s      | 500       |
| Cool down | 240s     | 100       |

Total: ~97k requests, targets 10,000 concurrent users at peak

## Quick Start

Start the services:

```bash
# From project root - start MongoDB & Redis
./docker-manager.sh start-infra

# Start services (from root)
npm run dev
```

Install dependencies:

```bash
# Install stress test dependencies
cd server/stress-tests && npm install
```

Create a test flash sale:

```bash
# Modify the start and end time as needed
curl -X POST http://localhost:5000/api/flash-sale/create \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Stress Test Product",
    "totalStock": 200,
    "startTime": "2026-02-14T00:00:00Z",
    "endTime": "2026-02-14T23:59:59Z"
  }'
```

Run the test:

```bash
# Run moderate test (recommended)
npm run test

# Or run extreme test
npm run test:extreme
```

That's it. Artillery will run for 7 minutes and print results at the end.

Other commands:

```bash
# Generate HTML report
npm run test:report

# Custom quick test
artillery quick --duration 120 --rate 50 http://localhost:5000/api/flash-sale/status
```

## What to look for

**Target Performance (Feb 14, 2026 results):**

- Response Time (median): < 5ms
- Response Time (p95): < 150ms
- Response Time (p99): < 300ms
- Success Rate: 100%
- No overselling

**Actual Results (Moderate Test):**

```
Load: 10,000 concurrent users, 500 req/sec peak
Requests: 97,560 total
Success Rate: 100%

Response Times:
  median: 3ms
  p95: 23.8ms
  p99: 61ms

Data Integrity: 200/200 purchases recorded
Overselling: None detected
```

If you see lots of errors or slow responses, something's wrong. Check backend logs, database, or test config.

## Verification

After the test, verify the data:

**MongoDB purchases:**

```bash
mongosh mongodb://localhost:27017/flash_sale_db

db.purchases.countDocuments({})
```

Should equal the totalStock (e.g., 100).

**Redis stock:**

```bash
redis-cli
GET flash_sale:*:stock
```

Should be 0 (sold out).

**Check for duplicates:**

```bash
db.purchases.aggregate([
  { $group: { _id: "$userIdentifier", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

Should return empty array.

**Flash sale document:**

```bash
db.flashsales.findOne({})
```

Check that `remainingStock` is updated correctly.

## Common Issues

**Artillery fails to connect:**

- Make sure backend is running on port 5000
- Check MongoDB and Redis are up
- Verify endpoints are configured correctly

**Lots of errors (>10%):**

- Flash sale might not be active (check time window)
- Stock depleted too quickly (increase totalStock)
- Server overloaded (check CPU/memory)

**Slow responses (>500ms):**

- Missing MongoDB indexes
- Redis connection issues
- Server needs more resources

**Overselling:**

- Critical bug! Check Lua script execution
- Verify Redis atomic operations
- Review service layer logic

## Advanced Testing

Want to push harder? Try these load patterns:

**High concurrency** (500 users/sec):

```yaml
phases:
  - duration: 60
    arrivalRate: 500
    name: 'Extreme load'
```

**Spike test** (sudden traffic burst):

```yaml
phases:
  - duration: 30
    arrivalRate: 10
  - duration: 10
    arrivalRate: 500
  - duration: 30
    arrivalRate: 10
```

**Soak test** (1 hour sustained load):

```yaml
phases:
  - duration: 3600
    arrivalRate: 50
    name: 'Sustained load'
```

## Checklist

Before running:

- [ ] Backend running on port 5000
- [ ] MongoDB connected
- [ ] Redis connected
- [ ] Flash sale created
- [ ] Endpoints working

## Links

- [Artillery Docs](https://www.artillery.io/docs)
- [Load Testing Best Practices](https://www.artillery.io/docs/guides/guides/load-testing-best-practices)

---

_Config version: 1.0 | Last updated: Feb 2026 | Artillery: ^2.0.0_
