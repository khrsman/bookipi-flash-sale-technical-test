/**
 * Sample Test Data for Flash Sale System
 * 
 * This file contains sample data that can be used for testing endpoints manually
 */

// ==================== CREATE FLASH SALE SAMPLES ====================

// Sample 1: Standard flash sale starting in 1 hour
const createFlashSale_Standard = {
  productName: "iPhone 16 Pro Max 256GB",
  totalStock: 100,
  startTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
  endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // 24 hours from now
};

// Sample 2: Flash sale that starts immediately
const createFlashSale_Immediate = {
  productName: "MacBook Air M4 16GB",
  totalStock: 50,
  startTime: new Date(Date.now() - 1000 * 60).toISOString(), // 1 minute ago
  endTime: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString() // 12 hours from now
};

// Sample 3: Limited stock flash sale
const createFlashSale_Limited = {
  productName: "PlayStation 5 Limited Edition",
  totalStock: 5,
  startTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 minutes from now
  endTime: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString() // 6 hours from now
};

// Sample 4: Large stock flash sale
const createFlashSale_LargeStock = {
  productName: "Wireless Mouse",
  totalStock: 1000,
  startTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
  endTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString() // 48 hours from now
};

// Sample 5: Short duration flash sale
const createFlashSale_ShortDuration = {
  productName: "Flash Deal: Gaming Keyboard",
  totalStock: 25,
  startTime: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 minutes from now
  endTime: new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hour from now
};

// ==================== PURCHASE SAMPLES ====================

// Sample 1: Purchase with email identifier
const purchase_Email = {
  userIdentifier: "john.doe@example.com"
};

// Sample 2: Purchase with username identifier
const purchase_Username = {
  userIdentifier: "johndoe123"
};

// Sample 3: Purchase with UUID identifier
const purchase_UUID = {
  userIdentifier: "550e8400-e29b-41d4-a716-446655440000"
};

// Sample 4: Purchase with phone number identifier
const purchase_Phone = {
  userIdentifier: "628123456789"
};

// Sample 5: Purchase with simple identifier
const purchase_Simple = {
  userIdentifier: "johndoe-twitter"
};

// ==================== CHECK PURCHASE USER IDENTIFIERS ====================

const checkPurchase_Samples = [
  "john.doe@example.com",
  "johndoe123",
  "550e8400-e29b-41d4-a716-446655440000",
  "628123456789",
  "johndoe-twitter"
];

// ==================== INVALID DATA SAMPLES (for error testing) ====================

// Invalid: Missing required fields
const createFlashSale_Invalid_MissingFields = {
  productName: "Missing Fields Product",
  totalStock: 50
  // Missing startTime and endTime
};

// Invalid: Negative stock
const createFlashSale_Invalid_NegativeStock = {
  productName: "Negative Stock Product",
  totalStock: -10,
  startTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
};

// Invalid: Zero stock
const createFlashSale_Invalid_ZeroStock = {
  productName: "Zero Stock Product",
  totalStock: 0,
  startTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
};

// Invalid: Start time after end time
const createFlashSale_Invalid_TimeOrder = {
  productName: "Invalid Time Order",
  totalStock: 50,
  startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  endTime: new Date(Date.now() + 1000 * 60 * 60).toISOString()
};

// Invalid: Missing user identifier
const purchase_Invalid_NoIdentifier = {};

// Invalid: Empty user identifier
const purchase_Invalid_EmptyIdentifier = {
  userIdentifier: ""
};

// ==================== CONCURRENT PURCHASE TEST DATA ====================

// Generate multiple user identifiers for concurrent testing
const generateConcurrentUsers = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    userIdentifier: `concurrent_user_${i + 1}@test.com`
  }));
};

// ==================== EXPORT ALL SAMPLES ====================

module.exports = {
  // Valid flash sale creation samples
  createFlashSale: {
    standard: createFlashSale_Standard,
    immediate: createFlashSale_Immediate,
    limited: createFlashSale_Limited,
    largeStock: createFlashSale_LargeStock,
    shortDuration: createFlashSale_ShortDuration
  },
  
  // Valid purchase samples
  purchase: {
    email: purchase_Email,
    username: purchase_Username,
    uuid: purchase_UUID,
    phone: purchase_Phone,
    simple: purchase_Simple
  },
  
  // Check purchase identifiers
  checkPurchase: checkPurchase_Samples,
  
  // Invalid data samples
  invalid: {
    createFlashSale: {
      missingFields: createFlashSale_Invalid_MissingFields,
      negativeStock: createFlashSale_Invalid_NegativeStock,
      zeroStock: createFlashSale_Invalid_ZeroStock,
      timeOrder: createFlashSale_Invalid_TimeOrder
    },
    purchase: {
      noIdentifier: purchase_Invalid_NoIdentifier,
      emptyIdentifier: purchase_Invalid_EmptyIdentifier
    }
  },
  
  // Utility functions
  generateConcurrentUsers
};
