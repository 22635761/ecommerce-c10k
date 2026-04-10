const cartService = require('../services/cart.service');

class CartController {
  // Lấy giỏ hàng
  async getCart(req, res) {
    try {
      const userId = req.user.userId;
      const cart = await cartService.getCart(userId);
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Thêm vào giỏ
  async addToCart(req, res) {
    try {
      const userId = req.user.userId;
      const { productId, name, price, image, quantity } = req.body;
      
      const cart = await cartService.addToCart(userId, productId, name, price, image, quantity || 1);
      
      res.status(200).json({
        success: true,
        data: cart,
        message: 'Đã thêm vào giỏ hàng'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Cập nhật số lượng
  async updateQuantity(req, res) {
    try {
      const userId = req.user.userId;
      const { productId, quantity } = req.body;
      
      const cart = await cartService.updateQuantity(userId, productId, quantity);
      
      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Xóa sản phẩm
  async removeFromCart(req, res) {
    try {
      const userId = req.user.userId;
      const { productId } = req.params;
      
      const cart = await cartService.removeFromCart(userId, productId);
      
      res.status(200).json({
        success: true,
        data: cart,
        message: 'Đã xóa sản phẩm khỏi giỏ hàng'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Xóa toàn bộ giỏ
  async clearCart(req, res) {
    try {
      const userId = req.user.userId;
      const cart = await cartService.clearCart(userId);
      
      res.status(200).json({
        success: true,
        data: cart,
        message: 'Đã xóa toàn bộ giỏ hàng'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CartController();
