const { metricsMiddleware, metricsEndpoint } = require("./middlewares/metrics");
const express = require('express');
const cors = require('cors');
const orderRoutes = require('./routes/order.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Metrics middleware
app.use(metricsMiddleware("order"));
app.use(express.urlencoded({ extended: true }));

app.use('/api/orders', orderRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'order-service' });
});

module.exports = app;

// Metrics endpoint
app.get("/metrics", metricsEndpoint);
