const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flashSaleController');
const { validateCreateFlashSale, validateUserIdentifier } = require('../middleware/validation');

// Create new flash sale
router.post('/create', validateCreateFlashSale, flashSaleController.createFlashSale);

// Get flash sale status (no id needed)
router.get('/status', flashSaleController.getStatus);

// Attempt purchase (no id needed)
router.post('/purchase', validateUserIdentifier, flashSaleController.attemptPurchase);

// Check if user purchased (no id needed)
router.get('/check-purchase/:userIdentifier', flashSaleController.checkPurchase);

module.exports = router;
