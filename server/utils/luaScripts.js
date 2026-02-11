/**
 * Redis Lua Scripts for Atomic Operations
 * 
 * WHY LUA SCRIPTS ARE NECESSARY:
 * Redis Lua scripts execute atomically, meaning all operations within the script
 * run as a single unit without interruption from other clients. This is crucial
 * for flash sales where multiple users attempt simultaneous purchases.
 */

/**
 * PURCHASE_SCRIPT - Atomic purchase operation
 * 
 * This Lua script ensures that inventory checks, stock decrements, and
 * user purchase records happen atomically in a single Redis operation.
 * 
 * KEYS[1]: Stock counter key - Format: "flash_sale:{flashSaleId}:stock"
 *          Stores the current available stock count
 * 
 * KEYS[2]: Users hash key - Format: "flash_sale:{flashSaleId}:users"
 *          Hash map storing user purchases: {userIdentifier: timestamp}
 * 
 * ARGV[1]: userIdentifier - User's email or username
 * ARGV[2]: timestamp - Current timestamp when purchase was attempted
 * 
 * RETURN CODES:
 * -1 : User has already purchased this item (duplicate purchase attempt)
 *  0 : Item is sold out (no stock remaining)
 *  1 : Purchase successful (stock decremented, user recorded)
 * 
 */

const PURCHASE_SCRIPT = `
-- Check if user has already purchased from this flash sale
-- This prevents duplicate purchases at the Redis level
local already_purchased = redis.call('HEXISTS', KEYS[2], ARGV[1])
if already_purchased == 1 then
    return -1  -- Error code: User already purchased
end

-- Get current stock level
-- Returns nil if key doesn't exist, or the current stock count
local current_stock = redis.call('GET', KEYS[1])

-- Validate stock availability
-- Handles both non-existent stock (nil) and zero/negative stock
if not current_stock or tonumber(current_stock) <= 0 then
    return 0  -- Error code: Item sold out
end

-- Perform atomic operations (only if all checks pass)
-- 1. Decrement stock counter
redis.call('DECR', KEYS[1])

-- 2. Record user purchase with timestamp
-- This creates a permanent record and prevents duplicate purchases
redis.call('HSET', KEYS[2], ARGV[1], ARGV[2])

-- Return success code
return 1  -- Success: Purchase completed
`;


module.exports = {
    PURCHASE_SCRIPT
};
