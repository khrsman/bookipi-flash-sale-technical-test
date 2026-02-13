const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// List all flash sales with stats
router.get('/flash-sales', adminController.listFlashSales);

// Reset database (clear all flash sales and purchases)
router.post('/reset-database', adminController.resetDatabase);

// Reset Redis (flush all Redis data)
router.post('/reset-redis', adminController.resetRedis);

// Reset all data (database + Redis)
router.post('/reset-all', adminController.resetAll);

module.exports = router;
