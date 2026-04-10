const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { isAdmin, isAuthenticated } = require('../middlewares/role.middleware');

router.post('/register-otp', authController.sendRegisterOtp);
router.post('/register-verify', authController.verifyRegisterOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/login', authController.login);
router.get('/profile', verifyToken, isAuthenticated, authController.getProfile);
router.put('/profile', verifyToken, isAuthenticated, authController.updateProfile);
router.post('/change-password', verifyToken, isAuthenticated, authController.changePassword);
router.get('/users', verifyToken, isAdmin, authController.getAllUsers);
router.put('/users/:id/role', verifyToken, isAdmin, authController.updateUserRole);

module.exports = router;
