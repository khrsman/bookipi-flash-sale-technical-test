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
      console.log(`✅ Purchase successful for user: ${context.vars.userIdentifier}`);
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
};
