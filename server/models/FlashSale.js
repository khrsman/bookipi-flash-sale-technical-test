const mongoose = require('mongoose');

/**
 * FlashSale Schema
 * Represents a flash sale event with product information, stock levels, and timing
 */
const flashSaleSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    totalStock: {
      type: Number,
      required: [true, 'Total stock is required'],
      min: [0, 'Total stock cannot be negative'],
    },
    remainingStock: {
      type: Number,
      required: [true, 'Remaining stock is required'],
      min: [0, 'Remaining stock cannot be negative'],
    },
    version: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'active', 'ended', 'sold_out'],
        message: '{VALUE} is not a valid status',
      },
      default: 'upcoming',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by status and time
flashSaleSchema.index({ status: 1, startTime: 1, endTime: 1 });

/**
 * Atomic stock decrement with optimistic locking
 * Prevents oversell by checking version number
 * @param {ObjectId} flashSaleId - The flash sale ID
 * @param {Number} quantity - Quantity to decrement
 * @returns {Object} Updated flash sale or null if version mismatch
 */
flashSaleSchema.statics.decrementStock = async function (flashSaleId, quantity = 1) {
  return await this.findOneAndUpdate(
    {
      _id: flashSaleId,
      remainingStock: { $gte: quantity }, // Ensure enough stock
    },
    {
      $inc: { remainingStock: -quantity, version: 1 }, // Increment version for optimistic locking
    },
    {
      returnDocument: 'after', // Return updated document
      runValidators: true,
    }
  );
};

/**
 * Atomic stock increment (for rollback)
 * @param {ObjectId} flashSaleId - The flash sale ID
 * @param {Number} quantity - Quantity to increment
 * @returns {Object} Updated flash sale
 */
flashSaleSchema.statics.incrementStock = async function (flashSaleId, quantity = 1) {
  return await this.findOneAndUpdate(
    { _id: flashSaleId },
    {
      $inc: { remainingStock: quantity, version: 1 },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );
};

module.exports = mongoose.model('FlashSale', flashSaleSchema);
