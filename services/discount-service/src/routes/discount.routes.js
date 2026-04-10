const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discount.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// User routes
router.post('/validate', discountController.applyDiscount); // Kiểm tra và tính tiền giảm (không cần đăng nhập)
router.post('/apply', verifyToken, discountController.applyDiscount); // Áp dụng (yêu cầu đăng nhập)
router.get('/active', discountController.getActiveDiscounts); // Lấy DS voucher cho Frontend

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, discountController.getAllDiscounts);
router.get('/admin/:id', verifyToken, isAdmin, discountController.getDiscountById);
router.post('/admin/create', verifyToken, isAdmin, discountController.createDiscount);
router.put('/admin/:id', verifyToken, isAdmin, discountController.updateDiscount);
router.delete('/admin/:id', verifyToken, isAdmin, discountController.deleteDiscount);

module.exports = router;
