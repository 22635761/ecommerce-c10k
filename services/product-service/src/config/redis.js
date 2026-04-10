const Redis = require('ioredis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
});

redisClient.on('connect', () => {
  console.log('[REDIS] Product-Service connected to Redis caching server', `${redisHost}:${redisPort}`);
});

redisClient.on('error', (err) => {
  console.error('[REDIS] Initializing error', err);
});

module.exports = redisClient;
