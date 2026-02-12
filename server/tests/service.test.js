const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const flashSaleService = require('../services/flashSaleService');
const FlashSale = require('../models/FlashSale');
const Purchase = require('../models/Purchase');
const { getRedisClient, initRedis, closeRedis } = require('../config/redis');

let mongoServer;
let redisClient;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  await initRedis();
  redisClient = getRedisClient();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await closeRedis();
});

beforeEach(async () => {
  await FlashSale.deleteMany({});
  await Purchase.deleteMany({});
  try {
    await redisClient.flushDb();
  } catch (error) {
    console.error('Error flushing Redis:', error);
  }
});

describe('FlashSaleService Unit Tests', () => {
  
  describe('createFlashSale', () => {
    
    it('should create flash sale and initialize Redis', async () => {
      const data = {
        productName: 'Test Product',
        totalStock: 50,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      const result = await flashSaleService.createFlashSale(data);

      expect(result).toBeDefined();
      expect(result.productName).toBe(data.productName);
      expect(result.totalStock).toBe(data.totalStock);
      expect(result.remainingStock).toBe(data.totalStock);

      // Verify Redis
      const stockKey = `flash_sale:${result._id}:stock`;
      const redisStock = await redisClient.get(stockKey);
      expect(parseInt(redisStock)).toBe(data.totalStock);
    });

    it('should set initial status to upcoming', async () => {
      const data = {
        productName: 'Future Product',
        totalStock: 100,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      const result = await flashSaleService.createFlashSale(data);
      expect(result.status).toBe('upcoming');
    });
  });

  describe('getFlashSaleStatus', () => {
    
    it('should return upcoming status', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Upcoming Product',
        totalStock: 100,
        remainingStock: 100,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'upcoming',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 100);

      const result = await flashSaleService.getFlashSaleStatus();
      expect(result.status).toBe('upcoming');
    });

    it('should return active status', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Active Product',
        totalStock: 100,
        remainingStock: 50,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 50);

      const result = await flashSaleService.getFlashSaleStatus();
      expect(result.status).toBe('active');
      expect(result.stockRemaining).toBe(50);
    });

    it('should return ended status', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Ended Product',
        totalStock: 100,
        remainingStock: 50,
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
        endTime: new Date(Date.now() - 1000 * 60 * 60),
        status: 'ended',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 50);

      const result = await flashSaleService.getFlashSaleStatus();
      expect(result.status).toBe('ended');
    });

    it('should return sold_out status', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Sold Out Product',
        totalStock: 100,
        remainingStock: 0,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 0);

      const result = await flashSaleService.getFlashSaleStatus();
      expect(result.status).toBe('sold_out');
      expect(result.stockRemaining).toBe(0);
    });

    it('should throw error when no flash sale exists', async () => {
      await expect(flashSaleService.getFlashSaleStatus()).rejects.toThrow('Flash sale not found');
    });
  });

  describe('attemptPurchase', () => {
    
    it('should successfully purchase', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Test Product',
        totalStock: 10,
        remainingStock: 10,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 10);

      const result = await flashSaleService.attemptPurchase('testuser');

      expect(result.success).toBe(true);
      expect(result.message).toContain('successful');
      expect(result).toHaveProperty('purchaseId');
    });

    it('should prevent duplicate purchase', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Test Product',
        totalStock: 10,
        remainingStock: 10,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 10);

      // First purchase
      await flashSaleService.attemptPurchase('duplicate-user');

      // Second attempt
      const result = await flashSaleService.attemptPurchase('duplicate-user');

      expect(result.success).toBe(false);
      expect(result.message).toContain('already purchased');
    });

    it('should fail when sale not started', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Future Product',
        totalStock: 10,
        remainingStock: 10,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'upcoming',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 10);

      const result = await flashSaleService.attemptPurchase('earlyuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not started');
    });

    it('should fail when sale ended', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Past Product',
        totalStock: 10,
        remainingStock: 5,
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 48),
        endTime: new Date(Date.now() - 1000 * 60 * 60),
        status: 'ended',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 5);

      const result = await flashSaleService.attemptPurchase('lateuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('ended');
    });

    it('should fail when sold out', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Sold Out',
        totalStock: 1,
        remainingStock: 0,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'sold_out',
      });

      await redisClient.set(`flash_sale:${flashSale._id}:stock`, 0);

      const result = await flashSaleService.attemptPurchase('unluckyuser');

      expect(result.success).toBe(false);
      expect(result.message).toContain('sold out');
    });
  });

  describe('checkUserPurchase', () => {
    
    it('should return true when user purchased', async () => {
      const flashSale = await FlashSale.create({
        productName: 'Test Product',
        totalStock: 100,
        remainingStock: 99,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      await Purchase.create({
        flashSaleId: flashSale._id,
        userIdentifier: 'purchased-user',
        purchasedAt: new Date(),
      });

      const result = await flashSaleService.checkUserPurchase('purchased-user');

      expect(result.hasPurchased).toBe(true);
      expect(result.purchaseTime).toBeTruthy();
    });

    it('should return false when user has not purchased', async () => {
      await FlashSale.create({
        productName: 'Test Product',
        totalStock: 100,
        remainingStock: 100,
        startTime: new Date(Date.now() - 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        status: 'active',
      });

      const result = await flashSaleService.checkUserPurchase('non-purchased-user');

      expect(result.hasPurchased).toBe(false);
      expect(result.purchaseTime).toBeNull();
    });
  });
});
