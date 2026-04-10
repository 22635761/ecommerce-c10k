const app = require('./app');

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log(`🛒 Cart Service running on port ${PORT}`);
  console.log(`📦 API: http://localhost:${PORT}/api/cart`);
});
