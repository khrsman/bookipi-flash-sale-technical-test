const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flashSaleController');
const { 
  validateCreateFlashSale, 
  validateUserIdentifier, 
  validateFlashSaleId 
} = require('../middleware/validation');


// Create new flash sale
router.post('/create', validateCreateFlashSale, flashSaleController.createFlashSale);

// Get flash sale status (no id needed)
router.get('/status', flashSaleController.getStatus);

module.exports = router;
