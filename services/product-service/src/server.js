const app = require('./app');
const startRabbitMQConsumer = require('./workers/rabbitmq.consumer');

startRabbitMQConsumer();

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 Product Service running on port ${PORT}`);
  console.log(`📦 API: http://localhost:${PORT}/api/products`);
});
