const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CartService {
  // Lấy giỏ hàng của user
  async getCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId }
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          items: [],
          total: 0
        }
      });
    }
    
    return cart;
  }

  // Thêm sản phẩm vào giỏ
  async addToCart(userId, productId, name, price, image, quantity = 1) {
    const cart = await this.getCart(userId);
    const items = cart.items || [];
    
    const existingItemIndex = items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex !== -1) {
      // Cập nhật số lượng
      items[existingItemIndex].quantity += quantity;
    } else {
      // Thêm sản phẩm mới
      items.push({
        productId,
        name,
        price,
        image,
        quantity
      });
    }
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const updatedCart = await prisma.cart.update({
      where: { userId },
      data: {
        items,
        total
      }
    });
    
    return updatedCart;
  }

  // Cập nhật số lượng sản phẩm
  async updateQuantity(userId, productId, quantity) {
    const cart = await this.getCart(userId);
    let items = cart.items || [];
    
    const itemIndex = items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      throw new Error('Sản phẩm không có trong giỏ hàng');
    }
    
    if (quantity <= 0) {
      // Xóa sản phẩm
      items = items.filter(item => item.productId !== productId);
    } else {
      items[itemIndex].quantity = quantity;
    }
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const updatedCart = await prisma.cart.update({
      where: { userId },
      data: {
        items,
        total
      }
    });
    
    return updatedCart;
  }

  // Xóa sản phẩm khỏi giỏ
  async removeFromCart(userId, productId) {
    return this.updateQuantity(userId, productId, 0);
  }

  // Xóa toàn bộ giỏ hàng
  async clearCart(userId) {
    const updatedCart = await prisma.cart.update({
      where: { userId },
      data: {
        items: [],
        total: 0
      }
    });
    
    return updatedCart;
  }
}

module.exports = new CartService();
