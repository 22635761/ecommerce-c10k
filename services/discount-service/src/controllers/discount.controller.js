const discountService = require('../services/discount.service');

class DiscountController {
  // Admin: Tạo mã giảm giá
  async createDiscount(req, res) {
    try {
      const discount = await discountService.createDiscount(req.body);
      res.status(201).json({ success: true, data: discount });
    } catch (error) {
      console.error('Create discount error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin: Lấy tất cả mã giảm giá
  async getAllDiscounts(req, res) {
    try {
      const discounts = await discountService.getAllDiscounts();
      res.status(200).json({ success: true, data: discounts });
    } catch (error) {
      console.error('Get discounts error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // User: Lấy các mã giảm giá đang hoạt động
  async getActiveDiscounts(req, res) {
    try {
      const discounts = await discountService.getActiveDiscounts();
      res.status(200).json({ success: true, data: discounts });
    } catch (error) {
      console.error('Get active discounts error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin: Lấy chi tiết mã giảm giá
  async getDiscountById(req, res) {
    try {
      const discount = await discountService.getDiscountById(req.params.id);
      if (!discount) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy mã giảm giá' });
      }
      res.status(200).json({ success: true, data: discount });
    } catch (error) {
      console.error('Get discount error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin: Cập nhật mã giảm giá
  async updateDiscount(req, res) {
    try {
      const discount = await discountService.updateDiscount(req.params.id, req.body);
      res.status(200).json({ success: true, data: discount });
    } catch (error) {
      console.error('Update discount error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Admin: Xóa mã giảm giá
  async deleteDiscount(req, res) {
    try {
      await discountService.deleteDiscount(req.params.id);
      res.status(200).json({ success: true, message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
      console.error('Delete discount error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // User: Kiểm tra và áp dụng mã giảm giá
  async applyDiscount(req, res) {
    try {
      const { code, subtotal, items } = req.body;
      const userId = req.user?.userId || null; // Không crash nếu chưa đăng nhập
      
      if (!code || !code.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
      }

      const result = await discountService.validateAndApplyDiscount(code.trim(), userId, subtotal || 0, items || []);
      
      if (!result.valid) {
        // Trả về lỗi rõ ràng để Frontend hiển thị
        return res.status(400).json({ success: false, message: result.message });
      }

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Apply discount error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new DiscountController();
