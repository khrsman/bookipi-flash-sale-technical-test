const mongoose = require('mongoose');

/**
 * Validate flash sale creation data
 */
exports.validateCreateFlashSale = (req, res, next) => {
  const { productName, totalStock, startTime, endTime } = req.body;

  // Check required fields
  const missingFields = [];
  if (!productName) missingFields.push('productName');
  if (!totalStock) missingFields.push('totalStock');
  if (!startTime) missingFields.push('startTime');
  if (!endTime) missingFields.push('endTime');

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  // Validate totalStock is positive number
  if (typeof totalStock !== 'number' || totalStock <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Total stock must be a positive number'
    });
  }

  // Validate startTime < endTime
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (start >= end) {
    return res.status(400).json({
      success: false,
      message: 'Start time must be before end time'
    });
  }

  next();
};
