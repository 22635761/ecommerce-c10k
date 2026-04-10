const client = require('prom-client');

// Collect default metrics (CPU, memory, event loop)
client.collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code', 'service'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});

const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests',
  labelNames: ['service']
});

const requestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service']
});

const metricsMiddleware = (serviceName) => {
  return (req, res, next) => {
    const start = Date.now();
    activeRequests.labels(serviceName).inc();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path;
      
      httpRequestDuration.labels(req.method, route, res.statusCode, serviceName).observe(duration);
      requestCounter.labels(req.method, route, res.statusCode, serviceName).inc();
      activeRequests.labels(serviceName).dec();
    });
    
    next();
  };
};

const metricsEndpoint = async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};

module.exports = { metricsMiddleware, metricsEndpoint };
