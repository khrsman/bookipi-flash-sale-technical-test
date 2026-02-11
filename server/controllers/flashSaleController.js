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
