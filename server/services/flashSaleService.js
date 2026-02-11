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

}

module.exports = new FlashSaleService();
