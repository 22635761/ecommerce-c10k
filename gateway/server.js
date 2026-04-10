const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration - FIX THIS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(morgan('dev'));

const services = {
  auth: 'http://localhost:3001',
  product: 'http://localhost:3002',
  order: 'http://localhost:3004',
  cart: 'http://localhost:3005',
  discount: 'http://localhost:3006',
  chat: 'http://localhost:3007'
};

function buildProxy(target, basePath, serviceName) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    logLevel: 'debug',
    // Add CORS headers to proxy response
    onProxyRes: (proxyRes, req, res) => {
      proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
      proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    },
    pathRewrite: (path) => {
      return path.startsWith(basePath) ? path : `${basePath}${path}`;
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`[GATEWAY -> ${serviceName}] ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`[GATEWAY] ${serviceName} proxy error:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: `Gateway cannot connect to ${serviceName}`,
          error: err.message
        });
      }
    }
  });
}

// Websocket proxy cho Socket.io
function buildWsProxy(target, serviceName) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true, // Kích hoạt WebSockets proxy
    logLevel: 'debug',
    onError: (err, req, res) => {
      console.error(`[GATEWAY] ${serviceName} WS proxy error:`, err.message);
    }
  });
}

app.get('/', (req, res) => {
  res.json({
    message: 'API Gateway is running',
    port: PORT
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    gateway: 'running'
  });
});

app.use('/api/auth', buildProxy(services.auth, '/api/auth', 'auth-service'));
app.use('/api/products', buildProxy(services.product, '/api/products', 'product-service'));
app.use('/api/orders', buildProxy(services.order, '/api/orders', 'order-service'));
app.use('/api/cart', buildProxy(services.cart, '/api/cart', 'cart-service'));
app.use('/api/discounts', buildProxy(services.discount, '/api/discounts', 'discount-service'));

// Proxy websocket requests (Socket.io thường dùng path /socket.io)
app.use('/socket.io', buildWsProxy(services.chat, 'chat-service'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found on API Gateway'
  });
});

app.listen(PORT, () => {
  console.log(`🚪 API Gateway running on http://localhost:${PORT}`);
  console.log(`↪ Auth      -> ${services.auth}/api/auth`);
  console.log(`↪ Products  -> ${services.product}/api/products`);
  console.log(`↪ Orders    -> ${services.order}/api/orders`);
  console.log(`↪ Cart      -> ${services.cart}/api/cart`);
  console.log(`↪ Discounts -> ${services.discount}/api/discounts`);
  console.log(`↪ Chat(WS)  -> ${services.chat}/socket.io`);
});