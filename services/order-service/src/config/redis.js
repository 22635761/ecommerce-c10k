const Redis = require('ioredis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
});

redisClient.on('connect', () => {
  console.log('[REDIS] Order-Service (Flash Sale) connected to Redis', `${redisHost}:${redisPort}`);
});

redisClient.on('error', (err) => {
  console.error('[REDIS] Initializing error', err);
});

module.exports = redisClient;
