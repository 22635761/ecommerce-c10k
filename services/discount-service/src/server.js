const app = require('./app');

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
  console.log(`🏷️  Discount Service running on port ${PORT}`);
  console.log(`📦 API: http://localhost:${PORT}/api/discounts`);
});
