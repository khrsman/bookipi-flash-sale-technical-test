# API Documentation

Complete API reference for the Flash Sale System.

**Base URL:** `http://localhost:5000`

---

## Table of Contents

- [Flash Sale Endpoints](#flash-sale-endpoints)
  - [Create Flash Sale](#1-create-flash-sale)
  - [Get Flash Sale Status](#2-get-flash-sale-status)
  - [Attempt Purchase](#3-attempt-purchase)
  - [Check User Purchase](#4-check-user-purchase)
- [Admin Endpoints](#admin-endpoints)
  - [List All Flash Sales](#5-list-all-flash-sales)
  - [Reset All Data](#6-reset-all-data)

---

## Flash Sale Endpoints

### 1. Create Flash Sale

**POST:** `api/flash-sale/create`

Creates a new flash sale. Only one flash sale can be active at a time.

**Request:**

```json
{
  "productName": "iPhone 16 Pro Max 256GB",
  "totalStock": 100,
  "startTime": "2026-12-31T22:59:59.000Z",
  "endTime": "2026-12-31T23:59:59.000Z"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "data": {
    "_id": "679e0a1b2c3d4e5f6a7b8c9d",
    "productName": "iPhone 16 Pro Max 256GB",
    "totalStock": 100,
    "remainingStock": 100,
    "startTime": "2026-12-31T22:59:59.000Z",
    "endTime": "2026-12-31T23:59:59.000Z",
    "status": "upcoming",
    "version": 0,
    "createdAt": "2026-02-14T10:30:00.000Z",
    "updatedAt": "2026-02-14T10:30:00.000Z"
  }
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "message": "A flash sale already exists. Please reset all data before creating a new one."
}
```

**Validation Rules:**

- `productName`: Required, non-empty string
- `totalStock`: Required, positive integer (>= 1)
- `startTime`: Required, valid ISO 8601 date
- `endTime`: Required, valid ISO 8601 date, must be after `startTime`

---

### 2. Get Flash Sale Status

**GET:** `api/flash-sale/status`

Returns the current flash sale status with real-time stock information from Redis.

**Request:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "id": "679e0a1b2c3d4e5f6a7b8c9d",
    "productName": "iPhone 16 Pro Max 256GB",
    "status": "active",
    "stockRemaining": 87,
    "totalStock": 100,
    "startTime": "2026-12-31T22:59:59.000Z",
    "endTime": "2026-12-31T23:59:59.000Z"
  }
}
```

**Response (Not Found - 404):**

```json
{
  "success": false,
  "message": "Flash sale not found"
}
```

**Status Values:**

- `upcoming`: Sale has not started yet
- `active`: Sale is currently active and has stock available
- `sold_out`: Sale is active but no stock remaining
- `ended`: Sale time period has passed

---

### 3. Attempt Purchase

**POST:** `api/flash-sale/purchase`

Attempts to purchase an item from the flash sale. Uses dual-layer validation (Redis + MongoDB) to prevent overselling.

**Request:**

```json
{
  "userIdentifier": "user@example.com"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Purchase successful!",
  "purchaseId": "679e0b2c3d4e5f6a7b8c9d0e"
}
```

**Response (Already Purchased - 200):**

```json
{
  "success": false,
  "message": "You have already purchased this item"
}
```

**Response (Sold Out - 200):**

```json
{
  "success": false,
  "message": "Item sold out"
}
```

**Response (Not Started - 200):**

```json
{
  "success": false,
  "message": "Sale has not started yet"
}
```

**Response (Ended - 200):**

```json
{
  "success": false,
  "message": "Sale has ended"
}
```

**Response (No Flash Sale - 400):**

```json
{
  "success": false,
  "message": "Flash sale not found"
}
```

**Validation Rules:**

- `userIdentifier`: Required, non-empty string (email, username, or user ID)
- One purchase per user per flash sale (enforced at both Redis and MongoDB levels)

---

### 4. Check User Purchase

**GET:** `api/flash-sale/check-purchase/:userIdentifier`

Checks if a specific user has made a purchase in the current flash sale.

**Request:** No body required. `userIdentifier` passed as URL parameter.

**Example URL:** `api/flash-sale/check-purchase/user@example.com`

**Response (User Purchased - 200):**

```json
{
  "success": true,
  "data": {
    "hasPurchased": true,
    "purchaseTime": "2026-02-14T10:35:42.123Z"
  }
}
```

**Response (User Not Purchased - 200):**

```json
{
  "success": true,
  "data": {
    "hasPurchased": false,
    "purchaseTime": null
  }
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "message": "Flash sale not found"
}
```

---

## Admin Endpoints

### 5. List All Flash Sales

**GET:** `api/admin/flash-sales`

Returns all flash sales with statistics. Used by the admin panel.

**Request:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "flashSales": [
      {
        "_id": "679e0a1b2c3d4e5f6a7b8c9d",
        "productName": "iPhone 16 Pro Max 256GB",
        "totalStock": 100,
        "remainingStock": 87,
        "startTime": "2026-12-31T22:59:59.000Z",
        "endTime": "2026-12-31T23:59:59.000Z",
        "status": "active",
        "version": 13,
        "createdAt": "2026-02-14T10:30:00.000Z",
        "updatedAt": "2026-02-14T10:35:00.000Z"
      }
    ],
    "totalFlashSales": 1,
    "totalPurchases": 13
  }
}
```

**Response (Error - 500):**

```json
{
  "success": false,
  "message": "Failed to list flash sales",
  "error": "Database connection error"
}
```

---

### 6. Reset All Data

**POST:** `api/admin/reset-all`

Resets both MongoDB and Redis. Equivalent to calling both `/reset-database` and `/reset-redis`.

**Request:** No body required

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "All data reset successfully",
  "data": {
    "flashSalesDeleted": 1,
    "purchasesDeleted": 13,
    "redisFlushed": true
  }
}
```

**Response (Error - 500):**

```json
{
  "success": false,
  "message": "Failed to reset all data",
  "error": "Database connection error"
}
```

---

## Common HTTP Status Codes

| Code | Description                                     |
| ---- | ----------------------------------------------- |
| 200  | Success - Request completed successfully        |
| 201  | Created - Resource created successfully         |
| 400  | Bad Request - Invalid input or validation error |
| 404  | Not Found - Resource not found                  |
| 500  | Internal Server Error - Server-side error       |

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Technical error details (optional)"
}
```

---

## Testing with cURL

### Create Flash Sale

```bash
curl -X POST http://localhost:5000/api/flash-sale/create \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "iPhone 16 Pro Max 256GB",
    "totalStock": 100,
    "startTime": "2026-02-14T10:00:00.000Z",
    "endTime": "2026-12-31T23:59:59.000Z"
  }'
```

### Get Status

```bash
curl http://localhost:5000/api/flash-sale/status
```

### Purchase Item

```bash
curl -X POST http://localhost:5000/api/flash-sale/purchase \
  -H "Content-Type: application/json" \
  -d '{"userIdentifier": "user@example.com"}'
```

### Check Purchase

```bash
curl http://localhost:5000/api/flash-sale/check-purchase/user@example.com
```

### List Flash Sales (Admin)

```bash
curl http://localhost:5000/api/admin/flash-sales
```

### Reset All Data (Admin)

```bash
curl -X POST http://localhost:5000/api/admin/reset-all
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. In production, consider adding:

- **Purchase endpoint:** Max 10 requests per minute per IP
- **Create endpoint:** Max 5 requests per hour (admin only)
- **Status endpoint:** Max 60 requests per minute

---

## Notes

1. **Single Flash Sale:** The system only supports one active flash sale at a time. Call `/api/admin/reset-all` before creating a new one.

2. **Dual-Layer Protection:** The purchase endpoint uses both Redis (fast check) and MongoDB (persistent validation) to prevent overselling.

3. **Idempotency:** Purchase requests are idempotent. Duplicate requests from the same user will return "already purchased" without creating duplicate records.

4. **Real-time Stock:** Status endpoint returns real-time stock from Redis, which may differ slightly from MongoDB during concurrent purchases (but never allows overselling).

5. **Time Zones:** All timestamps are in UTC (ISO 8601 format). Make sure to convert to/from your local timezone when needed.

---

## Postman Collection

Import the Postman collection for easy testing:

**Location:** `server/tests/Flash_Sale_API.postman_collection.json`

The collection includes all endpoints with example requests and environment variables.

---

## License

MIT License - For technical assessment purposes.
