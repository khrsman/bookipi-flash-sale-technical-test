const FlashSale = require('../models/FlashSale');
const Purchase = require('../models/Purchase');
const { getRedisClient } = require('../config/redis');
const { PURCHASE_SCRIPT } = require('../utils/luaScripts');

/**
 * FlashSaleService - Business logic for flash sale operations
 */
class FlashSaleService {
  
  /**
   * Create new flash sale and initialize Redis stock counter
   */
  async createFlashSale(data) {
    const { productName, totalStock, startTime, endTime } = data;

    const flashSale = new FlashSale({
      productName,
      totalStock,
      remainingStock: totalStock,
      startTime,
      endTime,
      status: 'upcoming'
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
      endTime: flashSale.endTime
    };
  }

  /**
   * Attempt purchase using atomic Lua script (single product)
   * Returns: -1 (already purchased), 0 (sold out), 1 (success)
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

    // Execute atomic Lua script
    const redisClient = getRedisClient();
    const stockKey = `flash_sale:${flashSale._id}:stock`;
    const usersKey = `flash_sale:${flashSale._id}:users`;
    
    const result = await redisClient.eval(PURCHASE_SCRIPT, {
      keys: [stockKey, usersKey],
      arguments: [userIdentifier, Date.now().toString()]
    });

    if (result === -1) {
      return { success: false, message: 'You have already purchased this item' };
    }
    
    if (result === 0) {
      return { success: false, message: 'Item sold out' };
    }
    
    // Save to MongoDB (fire-and-forget)
    const purchase = new Purchase({
      flashSaleId: flashSale._id,
      userIdentifier,
      purchasedAt: new Date()
    });
    
    purchase.save().catch(err => {
      console.error('Failed to save purchase to MongoDB:', err);
    });

    return {
      success: true,
      message: 'Purchase successful!',
      purchaseId: purchase._id.toString()
    };
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
      userIdentifier
    });

    return {
      hasPurchased: !!purchase,
      purchaseTime: purchase?.purchasedAt || null
    };
  }
}

module.exports = new FlashSaleService();
