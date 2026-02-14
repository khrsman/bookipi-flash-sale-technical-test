/**
 * Artillery Processors
 * Custom functions for request processing and data generation
 */

module.exports = {
  /**
   * Generate random user identifier
   */
  generateUserIdentifier: function (requestParams, context, ee, next) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    context.vars.userIdentifier = `user_${timestamp}_${random}@test.com`;
    return next();
  },

  /**
   * Log successful purchase for tracking
   */
  logPurchaseSuccess: function (requestParams, response, context, ee, next) {
    if (response.body && JSON.parse(response.body).success) {
      console.log(`Purchase successful for user: ${context.vars.userIdentifier}`);
    }
    return next();
  },

  /**
   * Log sale status
   */
  logSaleStatus: function (requestParams, response, context, ee, next) {
    if (response.body) {
      const data = JSON.parse(response.body);
      if (data.data && data.data.status) {
        console.log(`📊 Sale status: ${data.data.status}, Stock: ${data.data.stockRemaining}`);
      }
    }
    return next();
  },

  /**
   * Log status check with minimal output (for high-load tests)
   */
  logStatusCheck: function (requestParams, response, context, ee, next) {
    // Only log every 100th check to reduce noise in extreme tests
    if (Math.random() < 0.01) {
      if (response.body) {
        const data = JSON.parse(response.body);
        if (data.data) {
          console.log(`Status: ${data.data.status} | Stock: ${data.data.stockRemaining}`);
        }
      }
    }
    return next();
  },

  /**
   * Log purchase attempt with success/failure tracking
   */
  logPurchaseAttempt: function (requestParams, response, context, ee, next) {
    if (response.body) {
      const data = JSON.parse(response.body);
      if (data.success) {
        // Log all successful purchases
        console.log(`PURCHASE SUCCESS | User: ${requestParams.json.userIdentifier}`);
      } else if (Math.random() < 0.05) {
        // Log 5% of failures to track patterns
        console.log(`Purchase failed: ${data.message}`);
      }
    }
    return next();
  },
};
