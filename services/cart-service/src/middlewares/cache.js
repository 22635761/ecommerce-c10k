const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis-cache',
  port: 6379,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Cache middleware
const cacheMiddleware = (duration = 60) => {
  return async (req, res, next) => {
    // Chỉ cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl || req.url}`;
    
    try {
      const cachedData = await redis.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
      
      // Store original send
      const originalSend = res.json;
      res.json = function(data) {
        redis.setex(key, duration, JSON.stringify(data)).catch(console.error);
        originalSend.call(this, data);
      };
      
      next();
    } catch (err) {
      console.error('Redis error:', err.message);
      next();
    }
  };
};

// Clear cache by pattern
const clearCache = async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length) {
    await redis.del(...keys);
  }
};

module.exports = { cacheMiddleware, clearCache, redis };
