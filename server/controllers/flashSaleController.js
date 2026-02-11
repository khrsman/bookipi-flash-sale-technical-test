const flashSaleService = require('../services/flashSaleService');

/**
 * Create new flash sale
 */
exports.createFlashSale = async (req, res) => {
  try {
    const flashSale = await flashSaleService.createFlashSale(req.body);
    res.status(201).json({ success: true, data: flashSale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Get flash sale status (single product)
 */
exports.getStatus = async (req, res) => {
  try {
    const status = await flashSaleService.getFlashSaleStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

