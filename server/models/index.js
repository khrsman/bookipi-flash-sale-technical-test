/**
 * Models Index
 * Centralized export for all Mongoose models
 * Allows clean importing: const { FlashSale, Purchase } = require('./models')
 */

const FlashSale = require('./FlashSale');
const Purchase = require('./Purchase');

module.exports = {
  FlashSale,
  Purchase,
};
