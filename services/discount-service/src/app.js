const { metricsMiddleware, metricsEndpoint } = require("./middlewares/metrics");
const express = require('express');
const cors = require('cors');
const discountRoutes = require('./routes/discount.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Metrics middleware
app.use(metricsMiddleware("discount"));
app.use(express.urlencoded({ extended: true }));

app.use('/api/discounts', discountRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'discount-service' });
});

module.exports = app;

// Metrics endpoint
app.get("/metrics", metricsEndpoint);
