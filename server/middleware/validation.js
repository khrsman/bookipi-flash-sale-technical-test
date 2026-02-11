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

/**
 * Validate user identifier
 */
exports.validateUserIdentifier = (req, res, next) => {
  const { userIdentifier } = req.body;

  // Check if exists and not empty
  if (!userIdentifier || userIdentifier.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'User identifier is required'
    });
  }

  // Check minimum length
  if (userIdentifier.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'User identifier must be at least 3 characters'
    });
  }

  // Validate format (alphanumeric, email, or username)
  const validFormat = /^[a-zA-Z0-9@._-]+$/.test(userIdentifier);
  if (!validFormat) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user identifier format'
    });
  }

  next();
};

/**
 * Validate MongoDB ObjectId format
 */
exports.validateFlashSaleId = (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid flash sale ID format'
    });
  }

  next();
};
