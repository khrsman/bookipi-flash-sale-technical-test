# Flash Sale - Artillery Load Tests

## What's this?

Artillery config for load testing the flash sale backend. Run these tests to see how the system handles traffic spikes and concurrent purchases.

## Test Setup

Three scenarios running in parallel:

- **Check Status** (40%): `GET /api/flash-sale/status`
- **Attempt Purchase** (50%): `POST /api/flash-sale/purchase`
- **Check Purchase** (10%): `GET /api/flash-sale/check-purchase/user_test@example.com`

Load ramps up over 7 minutes:

| Phase       | Duration | Users/sec |
| ----------- | -------- | --------- |
| Warm up     | 60s      | 10        |
| Ramp up     | 120s     | 50        |
| Peak load   | 180s     | 100       |
| Stress test | 60s      | 200       |

Total: ~7 minutes, ~42k requests

## Quick Start

Install dependencies:

```bash
cd stress-tests
npm install
```

Start the services:

```bash
# Start MongoDB & Redis
docker compose -f docker/docker-compose-redis-mongo.yml up -d

# Start backend
cd server
npm run dev
```

Create a test flash sale:

```bash
curl -X POST http://localhost:5000/api/flash-sale/create \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Stress Test Product",
    "totalStock": 100,
    "startTime": "2026-02-13T00:00:00Z",
    "endTime": "2026-02-20T23:59:59Z"
  }'
```

Run the test:

```bash
npm test
```

That's it. Artillery will hit the endpoints for 7 minutes and print results at the end.

Other commands:

```bash
# Quick 60s test
npm run test:quick

# Generate HTML report
npm run test:report

# Custom quick test
artillery quick --duration 120 --rate 50 http://localhost:5000/api/flash-sale/status
```

## What to look for

Good results:

- Median response time < 50ms
- p95 < 100ms
- p99 < 200ms
- Success rate > 95%
- No overselling

Example:

```
http.codes.200: 42000
http.response_time:
  median: 12
  p95: 35
  p99: 85
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
