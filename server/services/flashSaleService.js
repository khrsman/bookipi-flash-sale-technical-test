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

}

module.exports = new FlashSaleService();
