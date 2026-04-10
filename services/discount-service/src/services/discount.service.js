const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DiscountService {
  // Tạo mã giảm giá
  async createDiscount(data) {
    // Xử lý giá trị value: nếu là free_shipping thì set null
    const value = data.type === 'free_shipping' ? null : data.value;
    
    const discount = await prisma.discount.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        type: data.type,
        value: value,
        applyTo: data.applyTo || 'all',
        applyIds: data.applyIds || null,
        minOrderAmount: data.minOrderAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
    return discount;
  }

  // Cập nhật mã giảm giá
  async updateDiscount(id, data) {
    const value = data.type === 'free_shipping' ? null : data.value;
    
    const discount = await prisma.discount.update({
      where: { id },
      data: {
        code: data.code ? data.code.toUpperCase() : undefined,
        name: data.name,
        description: data.description,
        type: data.type,
        value: value,
        applyTo: data.applyTo,
        applyIds: data.applyIds,
        minOrderAmount: data.minOrderAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isActive: data.isActive
      }
    });
    return discount;
  }

  // Lấy tất cả mã giảm giá (admin)
  async getAllDiscounts() {
    return await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  // Lấy các mã giảm giá đang hoạt động (dành cho User Frontend)
  async getActiveDiscounts() {
    const now = new Date();
    return await prisma.discount.findMany({
      where: { 
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Lấy mã giảm giá theo ID
  async getDiscountById(id) {
    return await prisma.discount.findUnique({ where: { id } });
  }

  // Lấy mã giảm giá theo code
  async getDiscountByCode(code) {
    return await prisma.discount.findUnique({
      where: { code: code.toUpperCase() }
    });
  }

  // Xóa mã giảm giá
  async deleteDiscount(id) {
    return await prisma.discount.delete({ where: { id } });
  }

  // Kiểm tra và áp dụng mã giảm giá
  async validateAndApplyDiscount(code, userId, subtotal, items = []) {
    const discount = await this.getDiscountByCode(code);
    
    if (!discount) {
      return { valid: false, message: 'Mã giảm giá không tồn tại' };
    }
    
    if (!discount.isActive) {
      return { valid: false, message: 'Mã giảm giá đã bị vô hiệu hóa' };
    }
    
    // Kiểm tra thời gian
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      return { valid: false, message: 'Mã giảm giá chưa có hiệu lực' };
    }
    if (discount.endDate && now > discount.endDate) {
      return { valid: false, message: 'Mã giảm giá đã hết hạn' };
    }
    
    // Kiểm tra số lần sử dụng
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' };
    }
    
    // Kiểm tra user đã dùng quá số lần cho phép chưa
    if (userId && discount.perUserLimit) {
      const userUsage = await prisma.userDiscount.findUnique({
        where: { userId_discountId: { userId, discountId: discount.id } }
      });
      if (userUsage && userUsage.usedCount >= discount.perUserLimit) {
        return { valid: false, message: 'Bạn đã sử dụng mã giảm giá này quá số lần cho phép' };
      }
    }
    
    // Kiểm tra đơn hàng tối thiểu
    if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
      return { 
        valid: false, 
        message: `Đơn hàng tối thiểu ${discount.minOrderAmount.toLocaleString()}đ để áp dụng mã này` 
      };
    }
    
    // Tính số tiền giảm
    let discountAmount = 0;
    let discountValue = 0;
    
    if (discount.type === 'free_shipping') {
      discountAmount = 0;
      discountValue = 0;
      return {
        valid: true,
        discount: discount,
        discountAmount: 0,
        discountValue: 0,
        type: 'free_shipping',
        message: 'Áp dụng miễn phí vận chuyển'
      };
    }
    
    if (discount.type === 'percentage') {
      discountValue = (subtotal * discount.value) / 100;
      if (discount.maxDiscountAmount && discountValue > discount.maxDiscountAmount) {
        discountValue = discount.maxDiscountAmount;
      }
      discountAmount = discountValue;
    } else if (discount.type === 'fixed') {
      discountValue = discount.value;
      discountAmount = Math.min(discount.value, subtotal);
    }
    
    return {
      valid: true,
      discount: discount,
      discountAmount: Math.round(discountAmount),
      discountValue: discountValue,
      type: discount.type,
      message: 'Áp dụng mã giảm giá thành công'
    };
  }

  // Ghi nhận sử dụng mã giảm giá
  async recordUsage(discountId, userId, orderId, discountAmount) {
    // Tăng usedCount cho discount
    await prisma.discount.update({
      where: { id: discountId },
      data: { usedCount: { increment: 1 } }
    });
    
    // Ghi nhận user đã sử dụng
    if (userId) {
      const existing = await prisma.userDiscount.findUnique({
        where: { userId_discountId: { userId, discountId } }
      });
      
      if (existing) {
        await prisma.userDiscount.update({
          where: { id: existing.id },
          data: { usedCount: { increment: 1 }, usedAt: new Date() }
        });
      } else {
        await prisma.userDiscount.create({
          data: { userId, discountId, usedCount: 1, usedAt: new Date() }
        });
      }
    }
    
    console.log(`Discount ${discountId} used by user ${userId} for order ${orderId}, amount: ${discountAmount}`);
  }
}

module.exports = new DiscountService();
