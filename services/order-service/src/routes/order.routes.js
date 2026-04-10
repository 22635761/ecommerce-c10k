const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Public routes
router.get('/sepay-form', orderController.getSePayForm);
router.post('/sepay-ipn', orderController.sepayIpn);
router.get('/check-payment/:orderCode', orderController.checkPayment);

// Flash Sale Endpoints (Public)
router.get('/flash-sale/active', orderController.getActiveFlashSale);
router.post('/flash-sale/buy', orderController.buyFlashSale);

// Protected routes
router.use(verifyToken);

router.post('/create', orderController.createOrder);
router.get('/my-orders', orderController.getUserOrders);
router.get('/:orderId', orderController.getOrderDetail);
router.post('/create-stripe-payment', orderController.createStripePayment);
router.post('/verify-stripe', orderController.verifyStripePayment);
router.post('/confirm-payment', orderController.confirmPaymentFallback);
router.post('/create-sepay-payment', orderController.createSePayPayment);
router.post('/calculate-shipping', orderController.calculateShippingFee);
router.patch('/:orderId/status', orderController.cancelOrderByUser); // Khách huỷ đơn
router.post('/ghn/services', orderController.getGHNServices);
router.post('/ghn/leadtime', orderController.getGHNLeadtime);
router.get('/ghn/track/:orderCode', orderController.trackGHNOrder);

// Admin routes
router.get('/admin/all', isAdmin, orderController.getAllOrders);
router.put('/admin/:orderId/status', isAdmin, orderController.updateOrderStatus);
router.put('/admin/:orderId/payment-status', isAdmin, orderController.updatePaymentStatusAdmin);
router.post('/admin/flash-sale/init', isAdmin, orderController.initFlashSale);

module.exports = router;
