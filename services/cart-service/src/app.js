const { metricsMiddleware, metricsEndpoint } = require("./middlewares/metrics");
const express = require('express');
const cors = require('cors');
const cartRoutes = require('./routes/cart.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Metrics middleware
app.use(metricsMiddleware("cart"));
app.use(express.urlencoded({ extended: true }));

app.use('/api/cart', cartRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'cart-service' });
});

module.exports = app;

// Metrics endpoint
app.get("/metrics", metricsEndpoint);
