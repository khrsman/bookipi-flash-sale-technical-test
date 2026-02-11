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

/**
 * Attempt purchase (single product)
 */
exports.attemptPurchase = async (req, res) => {
  try {
    const { userIdentifier } = req.body;
    const result = await flashSaleService.attemptPurchase(userIdentifier);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Check if user purchased (single product)
 */
exports.checkPurchase = async (req, res) => {
  try {
    const userIdentifier = req.params.userIdentifier;
    const result = await flashSaleService.checkUserPurchase(userIdentifier);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
