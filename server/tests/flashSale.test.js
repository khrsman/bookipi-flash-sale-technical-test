const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const FlashSale = require('../models/FlashSale');
const Purchase = require('../models/Purchase');
const { getRedisClient, initRedis, closeRedis } = require('../config/redis');

let mongoServer;
let redisClient;

/**
 * Setup MongoDB in-memory server and Redis mock
 */
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  // Initialize Redis
  await initRedis();
  redisClient = getRedisClient();
});

/**
 * Clean up after all tests
 */
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await closeRedis();
});

/**
 * Clear database and Redis before each test
 */
beforeEach(async () => {
  await FlashSale.deleteMany({});
  await Purchase.deleteMany({});
  
  // Clear all Redis keys (more thorough cleanup)
  try {
    await redisClient.flushDb();
  } catch (error) {
    console.error('Error flushing Redis:', error);
  }
});

describe('Flash Sale API Tests', () => {
  
  // ==================== CREATE FLASH SALE TESTS ====================
  
  describe('POST /api/flash-sale/create', () => {
    
    it('should create a new flash sale successfully', async () => {
      const flashSaleData = {
        productName: 'Macbook Pro',
        totalStock: 100,
        startTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
      };

      const response = await request(app)
        .post('/api/flash-sale/create')
        .send(flashSaleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.productName).toBe(flashSaleData.productName);
      expect(response.body.data.totalStock).toBe(flashSaleData.totalStock);
      expect(response.body.data.remainingStock).toBe(flashSaleData.totalStock);
      expect(response.body.data.status).toBe('upcoming');

      // Verify Redis stock is initialized
      const stockKey = `flash_sale:${response.body.data._id}:stock`;
      const redisStock = await redisClient.get(stockKey);
      expect(parseInt(redisStock)).toBe(flashSaleData.totalStock);
    });

    it('should fail without required fields', async () => {
      const response = await request(app)
        .post('/api/flash-sale/create')
        .send({
          productName: 'Test Product',
          // missing totalStock, startTime, endTime
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should fail with invalid stock (negative)', async () => {
      const response = await request(app)
        .post('/api/flash-sale/create')
        .send({
          productName: 'Test Product',
          totalStock: -10,
          startTime: new Date(Date.now() + 1000 * 60 * 60),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('positive number');
    });

    it('should fail with invalid stock (zero)', async () => {
      const response = await request(app)
        .post('/api/flash-sale/create')
        .send({
          productName: 'Test Product',
          totalStock: 0,
          startTime: new Date(Date.now() + 1000 * 60 * 60),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should fail when start time is after end time', async () => {
      const response = await request(app)
        .post('/api/flash-sale/create')
        .send({
          productName: 'Test Product',
          totalStock: 50,
          startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
          endTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Start time must be before end time');
    });

    it('should create flash sale with minimal stock', async () => {
      const response = await request(app)
        .post('/api/flash-sale/create')
        .send({
          productName: 'Limited Edition Watch',
          totalStock: 1,
          startTime: new Date(Date.now() + 1000 * 60 * 60),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalStock).toBe(1);
    });
  });

  // ==================== GET STATUS TESTS ====================
  
  describe('GET /api/flash-sale/status', () => {
    
    it('should get status of upcoming flash sale', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Samsung Galaxy S24',
        totalStock: 200,
        remainingStock: 200,
        startTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'upcoming',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 200);

      const response = await request(app)
        .get('/api/flash-sale/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('upcoming');
      expect(response.body.data.productName).toBe('Samsung Galaxy S24');
      expect(response.body.data.stockRemaining).toBe(200);
      expect(response.body.data.totalStock).toBe(200);
    });

    it('should get status of active flash sale', async () => {
      const flashSale = await FlashSale.create({
        productName: 'MacBook Pro M3',
        totalStock: 50,
        remainingStock: 30,
        startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
        status: 'active',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 30);

      const response = await request(app)
        .get('/api/flash-sale/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data.stockRemaining).toBe(30);
    });

    it('should get status of sold out flash sale', async () => {
      const flashSale = await FlashSale.create({
        productName: 'PlayStation 5',
        totalStock: 100,
        remainingStock: 0,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'sold_out',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 0);

      const response = await request(app)
        .get('/api/flash-sale/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('sold_out');
      expect(response.body.data.stockRemaining).toBe(0);
    });

    it('should get status of ended flash sale', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Xbox Series X',
        totalStock: 75,
        remainingStock: 25,
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        status: 'ended',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 25);

      const response = await request(app)
        .get('/api/flash-sale/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ended');
    });

    it('should return 404 when no flash sale exists', async () => {
      const response = await request(app)
        .get('/api/flash-sale/status')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  // ==================== PURCHASE TESTS ====================
  
  describe('POST /api/flash-sale/purchase', () => {
    
    it('should successfully purchase when sale is active', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Nintendo Switch OLED',
        totalStock: 10,
        remainingStock: 10,
        startTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day from now
        status: 'active',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 10);

      const response = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successful');
      expect(response.body).toHaveProperty('purchaseId');

      // Verify Redis stock decreased
      const newStock = await redisClient.get(stockKey);
      expect(parseInt(newStock)).toBe(9);

      // Verify user is added to Redis hash
      const usersKey = `flash_sale:${flashSale._id}:users`;
      const userPurchaseTime = await redisClient.hGet(usersKey, 'user123');
      expect(userPurchaseTime).toBeTruthy();
    });

    it('should prevent duplicate purchase from same user', async () => {
      const flashSale = await FlashSale.create({
        productName: 'AirPods Pro 2',
        totalStock: 50,
        remainingStock: 50,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 50);

      // First purchase
      await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user456' })
        .expect(200);

      // Second purchase attempt
      const response = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user456' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already purchased');

      // Verify stock only decreased once
      const newStock = await redisClient.get(stockKey);
      expect(parseInt(newStock)).toBe(49);
    });

    it('should fail when sale has not started', async () => {
      const flashSale = await FlashSale.create({
        productName: 'iPad Air',
        totalStock: 30,
        remainingStock: 30,
        startTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'upcoming',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 30);

      const response = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user789' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not started');
    });

    it('should fail when sale has ended', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Apple Watch Series 9',
        totalStock: 20,
        remainingStock: 10,
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
        endTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        status: 'ended',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 10);

      const response = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user999' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('ended');
    });

    it('should fail when item is sold out', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Sony WH-1000XM5',
        totalStock: 1,
        remainingStock: 0,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'sold_out',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 0);

      const response = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user000' })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('sold out');
    });

    it('should fail without user identifier', async () => {
      const response = await request(app)
        .post('/api/flash-sale/purchase')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User identifier is required');
    });

    it('should handle concurrent purchases correctly', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Dyson V15',
        totalStock: 5,
        remainingStock: 5,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      const stockKey = `flash_sale:${flashSale._id}:stock`;
      await redisClient.set(stockKey, 5);

      // Simulate concurrent purchases
      const purchases = [];
      for (let i = 1; i <= 10; i++) {
        purchases.push(
          request(app)
            .post('/api/flash-sale/purchase')
            .send({ userIdentifier: `user${i}` })
        );
      }

      const responses = await Promise.all(purchases);
      
      // Count successful purchases
      const successful = responses.filter(r => r.body.success === true);
      const soldOut = responses.filter(r => r.body.message === 'Item sold out');

      expect(successful.length).toBe(5);
      expect(soldOut.length).toBe(5);

      // Verify final stock
      const finalStock = await redisClient.get(stockKey);
      expect(parseInt(finalStock)).toBe(0);
    });
  });

  // ==================== CHECK PURCHASE TESTS ====================
  
  describe('GET /api/flash-sale/check-purchase/:userIdentifier', () => {
    
    it('should return true when user has purchased', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Tesla Model 3 Toy',
        totalStock: 100,
        remainingStock: 99,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      await Purchase.create({
        flashSaleId: flashSale._id,
        userIdentifier: 'john.doe@email.com',
        purchasedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/flash-sale/check-purchase/john.doe@email.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasPurchased).toBe(true);
      expect(response.body.data.purchaseTime).toBeTruthy();
    });

    it('should return false when user has not purchased', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Rolex Watch Replica',
        totalStock: 50,
        remainingStock: 50,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      const response = await request(app)
        .get('/api/flash-sale/check-purchase/jane.smith@email.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasPurchased).toBe(false);
      expect(response.body.data.purchaseTime).toBeNull();
    });

    it('should handle allowed special characters in user identifier', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Gaming Keyboard',
        totalStock: 75,
        remainingStock: 75,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      await Purchase.create({
        flashSaleId: flashSale._id,
        userIdentifier: 'user.test@example.com',
        purchasedAt: new Date(),
      });

      const response = await request(app)
        .get('/api/flash-sale/check-purchase/user.test@example.com')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasPurchased).toBe(true);
    });

    it('should return 404 when no flash sale exists', async () => {
      const response = await request(app)
        .get('/api/flash-sale/check-purchase/anyuser@email.com')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ==================== INTEGRATION TESTS ====================
  
  describe('Full Purchase Flow Integration', () => {
    
    it('should complete full purchase flow successfully', async () => {
      // 1. Create flash sale
      const createResponse = await request(app)
        .post('/api/flash-sale/create')
        .send({
          productName: 'Limited Edition Sneakers',
          totalStock: 100,
          startTime: new Date(Date.now() - 1000 * 60), // Started 1 minute ago
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);

      // 2. Check status - should be active
      const statusResponse = await request(app)
        .get('/api/flash-sale/status')
        .expect(200);

      expect(statusResponse.body.data.status).toBe('active');
      expect(statusResponse.body.data.stockRemaining).toBe(100);

      // 3. Make purchase
      const purchaseResponse = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'sneakerhead@email.com' })
        .expect(200);

      expect(purchaseResponse.body.success).toBe(true);

      // 4. Check status again - stock should decrease
      const statusResponse2 = await request(app)
        .get('/api/flash-sale/status')
        .expect(200);

      expect(statusResponse2.body.data.stockRemaining).toBe(99);

      // 5. Check user purchase
      const checkResponse = await request(app)
        .get('/api/flash-sale/check-purchase/sneakerhead@email.com')
        .expect(200);

      expect(checkResponse.body.data.hasPurchased).toBe(true);

      // 6. Try to purchase again - should fail
      const duplicateResponse = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'sneakerhead@email.com' })
        .expect(200);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.message).toContain('already purchased');
    });

    it('should handle multiple users purchasing', async () => {
      // Create flash sale
      await request(app)
        .post('/api/flash-sale/create')
        .send({
          productName: 'Concert Tickets',
          totalStock: 3,
          startTime: new Date(Date.now() - 1000 * 60),
          endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        })
        .expect(201);

      // Three different users purchase
      const user1 = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user1@email.com' })
        .expect(200);

      const user2 = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user2@email.com' })
        .expect(200);

      const user3 = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user3@email.com' })
        .expect(200);

      expect(user1.body.success).toBe(true);
      expect(user2.body.success).toBe(true);
      expect(user3.body.success).toBe(true);

      // Fourth user should fail - sold out
      const user4 = await request(app)
        .post('/api/flash-sale/purchase')
        .send({ userIdentifier: 'user4@email.com' })
        .expect(200);

      expect(user4.body.success).toBe(false);
      expect(user4.body.message).toContain('sold out');

      // Verify status is sold_out
      const statusResponse = await request(app)
        .get('/api/flash-sale/status')
        .expect(200);

      expect(statusResponse.body.data.status).toBe('sold_out');
      expect(statusResponse.body.data.stockRemaining).toBe(0);
    });
  });
});
