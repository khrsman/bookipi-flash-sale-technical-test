const mongoose = require('mongoose');

/**
 * FlashSale Schema
 * Represents a flash sale event with product information, stock levels, and timing
 */
const flashSaleSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  totalStock: {
    type: Number,
    required: [true, 'Total stock is required'],
    min: [0, 'Total stock cannot be negative']
  },
  remainingStock: {
    type: Number,
    required: [true, 'Remaining stock is required'],
    min: [0, 'Remaining stock cannot be negative']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required']
  },
  status: {
    type: String,
    enum: {
      values: ['upcoming', 'active', 'ended', 'sold_out'],
      message: '{VALUE} is not a valid status'
    },
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// Index for efficient querying by status and time
flashSaleSchema.index({ status: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('FlashSale', flashSaleSchema);
