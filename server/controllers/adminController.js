const { FlashSale, Purchase } = require('../models');
const { getRedisClient } = require('../config/redis');

/**
 * List all flash sales with stats
 */
exports.listFlashSales = async (req, res) => {
  try {
    const flashSales = await FlashSale.find({}).sort({ createdAt: -1 });
    const purchaseCount = await Purchase.countDocuments({});

    res.json({
      success: true,
      data: {
        flashSales,
        totalFlashSales: flashSales.length,
        totalPurchases: purchaseCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to list flash sales',
      error: error.message,
    });
  }
};

/**
 * Reset database - clear all flash sales and purchases
 */
exports.resetDatabase = async (req, res) => {
  try {
    // Delete all flash sales
    const flashSaleResult = await FlashSale.deleteMany({});

    // Delete all purchases
    const purchaseResult = await Purchase.deleteMany({});

    res.json({
      success: true,
      message: 'Database reset successfully',
      data: {
        flashSalesDeleted: flashSaleResult.deletedCount,
        purchasesDeleted: purchaseResult.deletedCount,
      },
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset database',
      error: error.message,
    });
  }
};

/**
 * Reset Redis - flush all Redis data
 */
exports.resetRedis = async (req, res) => {
  try {
    const redisClient = getRedisClient();

    if (!redisClient || !redisClient.isOpen) {
      throw new Error('Redis client is not connected');
    }

    // Flush all Redis data
    await redisClient.flushAll();

    res.json({
      success: true,
      message: 'Redis reset successfully',
    });
  } catch (error) {
    console.error('Error resetting Redis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset Redis',
      error: error.message,
    });
  }
};

/**
 * Reset all data - database and Redis
 */
exports.resetAll = async (req, res) => {
  try {
    // Reset database
    const flashSaleResult = await FlashSale.deleteMany({});
    const purchaseResult = await Purchase.deleteMany({});

    // Reset Redis
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isOpen) {
      await redisClient.flushAll();
    }

    res.json({
      success: true,
      message: 'All data reset successfully',
      data: {
        flashSalesDeleted: flashSaleResult.deletedCount,
        purchasesDeleted: purchaseResult.deletedCount,
        redisFlushed: true,
      },
    });
  } catch (error) {
    console.error('Error resetting all data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset all data',
      error: error.message,
    });
  }
};
