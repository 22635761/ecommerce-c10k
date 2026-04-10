const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class OrderService {
  generateOrderCode() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // Kết hợp timestamp (ms) + random để gần như không thể trùng
    const ts = Date.now().toString(36).slice(-4).toUpperCase();
    const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${year}${month}${day}${ts}${rand}`;
  }

  async createOrder(userId, orderData) {
    const { customerName, email, phone, address, province, district, ward, note, items, subtotal, shippingFee, total, paymentMethod, stripePaymentIntentId } = orderData;
    
    const orderCode = this.generateOrderCode();
    
    const initialStatusHistory = [
      { status: 'pending', timestamp: new Date().toISOString(), note: 'Đơn hàng đã được đặt thành công' }
    ];

    const order = await prisma.order.create({
      data: {
        orderCode,
        userId,
        customerName,
        email,
        phone,
        address,
        city: province, // Lưu tỉnh vào city
        district,
        ward,
        note,
        items,
        subtotal,
        shippingFee,
        total,
        paymentMethod: paymentMethod || 'cod',
        // COD = chưa thu tiền (unpaid), Stripe/SePay = đang chờ xác nhận (pending)
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'pending',
        orderStatus: 'pending',
        statusHistory: initialStatusHistory,
        stripePaymentIntentId
      }
    });
    
    return order;
  }

  async createStripePayment(orderId, amount, currency = 'vnd') {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: currency,
        metadata: { orderId }
      });
      
      await prisma.order.update({
        where: { id: orderId },
        data: { stripePaymentIntentId: paymentIntent.id }
      });
      
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment creation error:', error);
      throw error;
    }
  }

  async getUserOrders(userId) {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return orders;
  }

  async getOrderById(orderId, userId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId }
    });
    return order;
  }

  // Admin version: không lọc theo userId
  async getOrderByIdAdmin(orderId) {
    return prisma.order.findUnique({ where: { id: orderId } });
  }

  async getOrderByCode(orderCode) {
    const order = await prisma.order.findUnique({
      where: { orderCode }
    });
    return order;
  }

  async getAllOrders(page = 1, limit = 20, search = '', status = 'all') {
    const skip = (page - 1) * limit;
    
    let whereClause = {};
    if (search) {
      whereClause.OR = [
        { orderCode: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (status && status !== 'all') {
      whereClause.orderStatus = status;
    }

    if (limit > 0) {
      const [totalRecords, orders, pendingCount, deliveredCount, revAgg] = await prisma.$transaction([
        prisma.order.count({ where: whereClause }),
        prisma.order.findMany({
          where: whereClause,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.count({ where: { orderStatus: 'pending' } }),
        prisma.order.count({ where: { orderStatus: 'delivered' } }),
        prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'paid' } })
      ]);
      const globalStats = {
        pendingOrders: pendingCount,
        deliveredOrders: deliveredCount,
        totalRevenue: revAgg._sum.total || 0
      };
      return { orders, totalRecords, globalStats };
    } else {
      const orders = await prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });
      const pendingCount = orders.filter(o => o.orderStatus === 'pending').length;
      const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.paymentStatus === 'paid' ? o.total : 0), 0);
      return { orders, totalRecords: orders.length, globalStats: { pendingOrders: pendingCount, deliveredOrders: deliveredCount, totalRevenue } };
    }
  }

  async updateOrderStatus(orderId, status) {
    if (!orderId) throw new Error('Order ID is required');
    
    const statusNotes = {
      pending: 'Đơn hàng đang chờ xử lý',
      confirmed: 'Đơn hàng đã được xác nhận',
      shipped: 'Đơn hàng đang trên đường giao đến bạn',
      delivered: 'Đơn hàng đã được giao thành công',
      cancelled: 'Đơn hàng đã bị hủy'
    };

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) throw new Error('Order not found');

    // Idempotency: không ghi trùng status vào history
    const currentHistory = Array.isArray(existing.statusHistory) ? existing.statusHistory : [];
    const alreadyHasStatus = currentHistory.some(h => h.status === status);
    
    const newHistory = alreadyHasStatus
      ? currentHistory  // không thêm nếu đã tồn tại
      : [...currentHistory, {
          status,
          timestamp: new Date().toISOString(),
          note: statusNotes[status] || status
        }];

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: status, statusHistory: newHistory }
    });
    return order;
  }
  
  async updatePaymentStatus(orderId, status) {
    if (!orderId) throw new Error('Order ID is required');
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: status }
    });
    return order;
  }
}

module.exports = new OrderService();
