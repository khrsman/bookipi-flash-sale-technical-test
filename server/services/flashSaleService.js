const FlashSale = require('../models/FlashSale');
const Purchase = require('../models/Purchase');
const { getRedisClient } = require('../config/redis');
const { PURCHASE_SCRIPT, ROLLBACK_SCRIPT } = require('../utils/luaScripts');

/**
 * FlashSaleService - Business logic for flash sale operations
 * With dual-layer protection (Redis + MongoDB)
 */
class FlashSaleService {
  /**
   * Create new flash sale and initialize Redis stock counter
   * Only one flash sale is allowed at a time
   */
  async createFlashSale(data) {
    // Check if there's already an existing flash sale
    const existingFlashSale = await FlashSale.findOne();
    if (existingFlashSale) {
      throw new Error(
        'A flash sale already exists. Please reset all data before creating a new one.'
      );
    }

    const { productName, totalStock, startTime, endTime } = data;

    const flashSale = new FlashSale({
      productName,
      totalStock,
      remainingStock: totalStock,
      startTime,
      endTime,
      status: 'upcoming',
    });

    await flashSale.save();

    // Initialize Redis stock counter
    const redisClient = getRedisClient();
    const stockKey = `flash_sale:${flashSale._id}:stock`;
    await redisClient.set(stockKey, totalStock);

    return flashSale;
  }

  /**
   * Get flash sale status with real-time stock from Redis (single product)
   */
  async getFlashSaleStatus() {
    const flashSale = await FlashSale.findOne();

    if (!flashSale) {
      throw new Error('Flash sale not found');
    }

    const now = new Date();
    const redisClient = getRedisClient();
    const stockKey = `flash_sale:${flashSale._id}:stock`;
    const stockRemaining = parseInt(await redisClient.get(stockKey)) || 0;

    // Determine status based on time and stock
    let status;
    if (now < new Date(flashSale.startTime)) {
      status = 'upcoming';
    } else if (now > new Date(flashSale.endTime)) {
      status = 'ended';
    } else if (stockRemaining > 0) {
      status = 'active';
    } else {
      status = 'sold_out';
    }

    return {
      id: flashSale._id.toString(),
      productName: flashSale.productName,
      status,
      stockRemaining,
      totalStock: flashSale.totalStock,
      startTime: flashSale.startTime,
      endTime: flashSale.endTime,
    };
  }

  /**
   * Attempt purchase with DUAL-LAYER PROTECTION
   * Layer 1: Redis atomic operations (fast, prevents concurrent oversell)
   * Layer 2: MongoDB atomic operations with transactions (persistent, final validation)
   */
  async attemptPurchase(userIdentifier) {
    const flashSale = await FlashSale.findOne();

    if (!flashSale) {
      throw new Error('Flash sale not found');
    }

    const now = new Date();

    if (now < new Date(flashSale.startTime)) {
      return { success: false, message: 'Sale has not started yet' };
    }

    if (now > new Date(flashSale.endTime)) {
      return { success: false, message: 'Sale has ended' };
    }

    // LAYER 1: Redis Atomic Check & Lock
    const redisClient = getRedisClient();
    const stockKey = `flash_sale:${flashSale._id}:stock`;
    const usersKey = `flash_sale:${flashSale._id}:users`;

    const redisResult = await redisClient.eval(PURCHASE_SCRIPT, {
      keys: [stockKey, usersKey],
      arguments: [userIdentifier, Date.now().toString()],
    });

    if (redisResult === -1) {
      return { success: false, message: 'You have already purchased this item' };
    }

    if (redisResult === 0) {
      return { success: false, message: 'Item sold out' };
    }

    // LAYER 2: MongoDB Atomic Operations with Double Validation
    // Note: Using atomic operations instead of transactions (which require replica set)
    // This is safe because:
    // 1. FlashSale.decrementStock uses atomic findOneAndUpdate
    // 2. Purchase.save has unique index on (flashSaleId + userIdentifier)
    // 3. Redis rollback ensures consistency if MongoDB operations fail

    try {
      // Step 1: Atomic stock decrement with optimistic locking
      const updatedFlashSale = await FlashSale.decrementStock(flashSale._id, 1);

      if (!updatedFlashSale) {
        // MongoDB stock validation failed - Redis was wrong or race condition
        throw new Error('STOCK_VALIDATION_FAILED');
      }

      // Step 2: Create purchase record (duplicate check via unique index)
      const purchase = new Purchase({
        flashSaleId: flashSale._id,
        userIdentifier,
        purchasedAt: new Date(),
      });

      await purchase.save();

      return {
        success: true,
        message: 'Purchase successful!',
        purchaseId: purchase._id.toString(),
      };
    } catch (mongoError) {
      // CRITICAL: MongoDB failed after Redis success - Must rollback Redis
      const isDuplicateError = mongoError.code === 11000;
      const isStockError = mongoError.message === 'STOCK_VALIDATION_FAILED';

      // eslint-disable-next-line no-console
      console.error(
        `MongoDB ${isDuplicateError ? 'duplicate' : isStockError ? 'stock validation' : 'transaction'} failed, rolling back Redis:`,
        mongoError.message
      );

      // Rollback Redis to maintain consistency
      try {
        await redisClient.eval(ROLLBACK_SCRIPT, {
          keys: [stockKey, usersKey],
          arguments: [userIdentifier],
        });
        // eslint-disable-next-line no-console
        console.log(`Redis rollback successful for user: ${userIdentifier}`);
      } catch (rollbackError) {
        // DISASTER: Rollback failed - data inconsistency detected
        // eslint-disable-next-line no-console
        console.error('CRITICAL: Redis rollback failed! Data inconsistency:', rollbackError);
        // eslint-disable-next-line no-console
        console.error('Manual intervention required:', {
          flashSaleId: flashSale._id,
          userIdentifier,
          timestamp: new Date(),
          redisStock: await redisClient.get(stockKey),
          mongoStock: flashSale.remainingStock,
        });
      }

      // Return user-friendly error messages
      if (isDuplicateError) {
        return { success: false, message: 'You have already purchased this item' };
      }

      if (isStockError) {
        return { success: false, message: 'Item sold out' };
      }

      return {
        success: false,
        message: 'Purchase failed due to system error. Please try again.',
      };
    }
  }

  /**
   * Check if user already purchased (single product)
   */
  async checkUserPurchase(userIdentifier) {
    const flashSale = await FlashSale.findOne();

    if (!flashSale) {
      throw new Error('Flash sale not found');
    }

    const purchase = await Purchase.findOne({
      flashSaleId: flashSale._id,
      userIdentifier,
    });

    return {
      hasPurchased: !!purchase,
      purchaseTime: purchase?.purchasedAt || null,
    };
  }
}

module.exports = new FlashSaleService();
