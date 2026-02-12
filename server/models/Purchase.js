const mongoose = require('mongoose');

/**
 * Purchase Schema
 * Tracks individual purchases made during flash sales
 * Ensures one purchase per user per flash sale through compound unique index
 */
const purchaseSchema = new mongoose.Schema({
  flashSaleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FlashSale',
    required: [true, 'Flash sale ID is required'],
  },
  userIdentifier: {
    type: String,
    required: [true, 'User identifier is required'],
    trim: true,
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});

/**
 * Compound unique index to enforce one purchase per user per flash sale
 * This prevents duplicate purchases at the database level
 */
purchaseSchema.index({ flashSaleId: 1, userIdentifier: 1 }, { unique: true });

// Index for querying purchases by flash sale
purchaseSchema.index({ flashSaleId: 1 });

// Index for querying purchases by user
purchaseSchema.index({ userIdentifier: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
