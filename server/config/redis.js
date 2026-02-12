const redis = require('redis');

let redisClient;

/**
 * Connect to Redis
 */
async function connectRedis() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Error:', err);
    });

    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    process.exit(1);
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  return redisClient;
}

module.exports = {
  connectRedis,
  getRedisClient,
};
