const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  deductStock,
  restoreStock,
  addReview,
  getReviews,
  replyToReview
} = require('../controllers/product.controller');

const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Public routes
router.get('/', getProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);
router.get('/:id/reviews', getReviews);

// User interact routes
// Cần truyền middleware Auth ở Production, nhưng demo cứ bypass trước
router.post('/:id/reviews', verifyToken, addReview);

// Admin / Moderator routes
router.post('/:id/reviews/:reviewId/reply', verifyToken, isAdmin, replyToReview);

// Microservices internal routes
router.post('/inventory/deduct', deductStock);
router.post('/inventory/restore', restoreStock);

// Admin routes
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
