const app = require('./app');
require('./workers/queue.worker');

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`📦 Order Service running on port ${PORT}`);
  console.log(`📦 API: http://localhost:${PORT}/api/orders`);
});
