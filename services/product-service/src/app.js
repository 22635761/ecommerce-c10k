const { metricsMiddleware, metricsEndpoint } = require("./middlewares/metrics");
const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Metrics middleware
app.use(metricsMiddleware("product"));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'product-service' });
});

module.exports = app;

// Metrics endpoint
app.get("/metrics", metricsEndpoint);
