const { metricsMiddleware, metricsEndpoint } = require("./middlewares/metrics");
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Metrics middleware
app.use(metricsMiddleware("auth"));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'auth-service' });
});

module.exports = app;

// Metrics endpoint
app.get("/metrics", metricsEndpoint);
