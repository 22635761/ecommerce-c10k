const orderService = require('../services/order.service');
const sepayService = require('../services/sepay.service');
const shippingService = require('../services/shipping.service');
const ghnService = require('../services/ghn.service');
const redisClient = require('../config/redis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { publishDelayedReserve, publishDelayedOrderCancel, publishInventoryCmd } = require('../config/queue');

// LUA Script: Kiểm tra Thời Gian & Trừ kho an toàn tuyệt đối
const deductStockScript = `
  local startTime = tonumber(redis.call('hget', KEYS[1], 'startTime'))
  local currentTime = tonumber(ARGV[1])

  -- Lỗi -1: Phiên Sale chưa bắt đầu
  if not startTime or currentTime < startTime then
    return -1 
  end

  local stock = tonumber(redis.call('hget', KEYS[1], 'stock'))
  if stock and stock > 0 then
    redis.call('hincrby', KEYS[1], 'stock', -1)
    return 1 -- Thành công
  end
  return 0 -- Hết hàng
`;

class OrderController {
  async createOrder(req, res) {
    try {
      const userId = req.user.userId;
      const orderData = req.body;

      // 1. GỌI ĐỒNG BỘ ĐỂ TRỪ KHO (Ngăn chặn bán hàng âm kho - Overselling)
      const productApiUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002/api/products';
      
      try {
        await axios.post(`${productApiUrl}/inventory/deduct`, { items: orderData.items });
      } catch (err) {
        if (err.response && err.response.data && err.response.data.message) {
           return res.status(400).json({ success: false, message: err.response.data.message });
        }
        console.error('Inventory Check Error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra tồn kho' });
      }

      // 2. TẠO ĐƠN HÀNG SAU KHI ĐÃ CÓ HÀNG
      let order;
      try {
        order = await orderService.createOrder(userId, orderData);
      } catch (err) {
        // Fallback: Trả lại hàng nếu tạo đơn lỗi (Database error v.v.)
        console.error('Create order DB error, restoring stock...', err);
        try {
          await axios.post(`${productApiUrl}/inventory/restore`, { items: orderData.items });
        } catch (restoreErr) {
          console.error('FATAL: Có lỗi khi hoàn kho sau khi tạo đơn thất bại!', restoreErr);
        }
        return res.status(500).json({ success: false, message: 'Lỗi tạo đơn hàng, vui lòng thử lại!' });
      }

      // Kiểm tra và Xóa Reserve nếu có reservationId từ Flash Sale
      let isFlashSale = false;
      let flashSaleProductId = null;
      if (orderData.reservationId) {
         // Atomic Delete check: Tránh Race Condition
         const deletedCount = await redisClient.del(`flash_sale_reserve:${orderData.reservationId}`);
         if (deletedCount === 0) {
             return res.status(400).json({ 
                 success: false, 
                 message: 'Quá thời hạn 1 phút cho phép! Suất mua Flash Sale của bạn đã bị lấy lại để nhường cho người khác.' 
             });
         }

         isFlashSale = true;
         // Lấy 1 product ID bất kỳ từ items để làm flashSaleProductId (giả sử cart Buy Now flash sale chỉ có 1 sp)
         flashSaleProductId = orderData.items && orderData.items[0] ? orderData.items[0].productId : null;
      }

      // Đẩy Job vào Queue đếm ngược 10 phút cho Đơn hàng chưa Thanh Toán Online (Stripe, Sepay)
      // COD thì không hủy vì khách sẽ thanh toán khi nhận hàng
      if (order.paymentStatus === 'pending' && order.paymentMethod !== 'cod') {
         // Gửi vào hàng đợi 10 phút của RabbitMQ
         await publishDelayedOrderCancel({
            orderId: order.id,
            isFlashSale: isFlashSale,
            productId: flashSaleProductId
         });
      }

      res.status(201).json({ success: true, data: order, message: 'Đặt hàng thành công' });
    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async createStripePayment(req, res) {
    try {
      const { orderId, amount } = req.body;
      const result = await orderService.createStripePayment(orderId, amount);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error('Stripe payment error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async verifyStripePayment(req, res) {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Thiếu orderId' });
      }
      const order = await orderService.updatePaymentStatus(orderId, 'paid');
      await orderService.updateOrderStatus(orderId, 'confirmed');
      res.status(200).json({ success: true, data: order, message: 'Ghi nhận thanh toán Stripe thành công' });
    } catch (error) {
      console.error('Verify Stripe error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // SEPAY
  async createSePayPayment(req, res) {
    try {
      const { orderId, amount, orderCode } = req.body;

      if (!orderId || !orderCode) {
        return res.status(400).json({
          success: false,
          message: "Thiếu orderId hoặc orderCode"
        });
      }

      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: `Số tiền không hợp lệ: `
        });
      }

      const result = sepayService.createPayment(orderId, parsedAmount, orderCode);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error("SePay payment error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
  
  async getSePayForm(req, res) {
    try {
      const { orderId, amount, orderCode } = req.query;
      if (!orderId || !amount || !orderCode) {
        return res.status(400).send('Thiếu thông tin đơn hàng');
      }
      const html = sepayService.generatePaymentForm(orderId, parseInt(amount), orderCode);
      res.send(html);
    } catch (error) {
      console.error('SePay form error:', error);
      res.status(500).send('Có lỗi xảy ra');
    }
  }
  
  async sepayIpn(req, res) {
    try {
      const data = req.body;
      const result = sepayService.handleIPN(data);
      
      if (result.success && result.orderCode) {
        const order = await orderService.getOrderByCode(result.orderCode);
        
        if (order) {
          const isNotPaid = order.paymentStatus !== 'paid';
          const amountValid = result.amount >= order.total;
          
          if (isNotPaid && amountValid) {
            await orderService.updatePaymentStatus(order.id, 'paid');
            await orderService.updateOrderStatus(order.id, 'confirmed');
          }
        }
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('SePay IPN error:', error);
      res.status(200).json({ success: false });
    }
  }
  
  async checkPayment(req, res) {
    try {
      const { orderCode } = req.params;
      const order = await orderService.getOrderByCode(orderCode);
      res.status(200).json({
        success: true,
        data: {
          paymentStatus: order?.paymentStatus || 'pending',
          orderStatus: order?.orderStatus || 'pending'
        }
      });
    } catch (error) {
      console.error('Check payment error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // SHIPPING — Tích hợp GHN API thật
  async calculateShippingFee(req, res) {
    try {
      const { province, items, districtId, wardCode } = req.body;

      const weight = shippingService.calculateWeight(items || []);
      const totalAmount = items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

      // Nếu có mã huyện/xã GHN → gọi API thật
      if (districtId && wardCode) {
        const ghnResult = await ghnService.calculateFee({
          toDistrictId: districtId,
          toWardCode: wardCode,
          weightGram: weight,
          value: totalAmount
        });

        if (ghnResult.success) {
          console.log('[GHN] Phí ship thực tế:', ghnResult.fee);
          return res.status(200).json({
            success: true,
            fee: ghnResult.fee,
            weight,
            totalAmount,
            source: 'ghn',
            feeDetails: ghnResult.feeDetails
          });
        }
        // GHN thất bại → fallback
        console.warn('[GHN] Fallback về phí tĩnh:', ghnResult.error);
      }

      // Fallback: Tính phí thủ công theo tên tỉnh
      const fee = shippingService.calculateFee(province, weight, totalAmount);
      console.log('[Shipping] Phí tĩnh:', fee);

      res.status(200).json({
        success: true,
        fee,
        weight,
        totalAmount,
        source: 'static'
      });
    } catch (error) {
      console.error('Calculate shipping fee error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ─── GHN: Lấy dịch vụ vận chuyển ──────────────────────────────────────────
  async getGHNServices(req, res) {
    try {
      const { fromDistrictId, toDistrictId } = req.body;
      const FROM = fromDistrictId || 1461; // Default: Gò Vấp HCM (shop)
      const result = await ghnService.getAvailableServices(FROM, toDistrictId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, services: [], message: err.message });
    }
  }

  // ─── GHN: Thời gian giao hàng dự kiến ─────────────────────────────────────
  async getGHNLeadtime(req, res) {
    try {
      const { toDistrictId, toWardCode, serviceId } = req.body;
      const result = await ghnService.getLeadtime({ toDistrictId, toWardCode, serviceId });
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ─── GHN: Tra cứu trạng thái vận đơn ─────────────────────────────────────
  async trackGHNOrder(req, res) {
    try {
      const { orderCode } = req.params;
      const result = await ghnService.trackOrder(orderCode);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // CÁC HÀM KHÁC
  // ─── Khách tự huỷ đơn hàng ────────────────────────────────────────────────
  async cancelOrderByUser(req, res) {
    try {
      const userId = req.user.userId;
      const { orderId } = req.params;
      const { status } = req.body;

      // Chỉ cho phép hành động cancel
      if (status !== 'cancelled') {
        return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ huỷ đơn' });
      }

      // Kiểm tra đơn thuộc về user này
      const order = await orderService.getOrderById(orderId, userId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      // Chỉ huỷ được khi đơn đang pending
      if (order.orderStatus !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Không thể huỷ — đơn hàng đang ở trạng thái "${order.orderStatus}"`
        });
      }

      const updated = await orderService.updateOrderStatus(orderId, 'cancelled');

      // Hoàn kho qua RabbitMQ
      if (updated.items) {
        await publishInventoryCmd({ action: 'restore', items: updated.items });
      }

      res.json({ success: true, data: updated, message: 'Đã huỷ đơn hàng thành công' });
    } catch (error) {
      console.error('Cancel order by user error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserOrders(req, res) {
    try {
      const userId = req.user.userId;
      const orders = await orderService.getUserOrders(userId);
      res.status(200).json({ success: true, data: orders });
    } catch (error) {
      console.error('Get orders error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  async getOrderDetail(req, res) {
    try {
      const userId = req.user.userId;
      const { orderId } = req.params;
      const order = await orderService.getOrderById(orderId, userId);
      if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      res.status(200).json({ success: true, data: order });
    } catch (error) {
      console.error('Get order detail error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  async getAllOrders(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 20;
      const search = req.query.search || '';
      const status = req.query.status || 'all';

      const { orders, totalRecords, globalStats } = await orderService.getAllOrders(page, limit, search, status);
      
      const totalPages = limit > 0 ? Math.ceil(totalRecords / limit) : 1;

      res.status(200).json({ 
        success: true, 
        data: orders,
        globalStats,
        pagination: {
           currentPage: page,
           limit: limit,
           totalRecords,
           totalPages
        }
      });
    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      // Kiểm tra trạng thái hiện tại trước khi cập nhật
      if (status === 'cancelled') {
        const current = await orderService.getOrderByIdAdmin(orderId);
        const NON_CANCELLABLE = ['shipped', 'delivered', 'cancelled'];
        if (current && NON_CANCELLABLE.includes(current.orderStatus)) {
          return res.status(400).json({
            success: false,
            message: `Không thể huỷ đơn hàng đang ở trạng thái "${current.orderStatus}"`
          });
        }
      }

      const order = await orderService.updateOrderStatus(orderId, status);
      
      // Hoàn kho nếu huỷ đơn thông qua RabbitMQ
      if (status === 'cancelled' && order && order.items) {
        await publishInventoryCmd({ action: 'restore', items: order.items });
      }

      res.status(200).json({ success: true, data: order, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updatePaymentStatusAdmin(req, res) {
    try {
      const { orderId } = req.params;
      const { paymentStatus } = req.body;
      const order = await orderService.updatePaymentStatus(orderId, paymentStatus);
      if (paymentStatus === 'paid' && order.orderStatus === 'pending') {
         await orderService.updateOrderStatus(orderId, 'confirmed');
      }
      res.status(200).json({ success: true, message: 'Cập nhật trạng thái thanh toán thành công' });
    } catch (error) {
      console.error('Update payment status admin error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async confirmPaymentFallback(req, res) {
    try {
      const { orderCode } = req.body;
      if (!orderCode) return res.status(400).json({ success: false });
      const order = await orderService.getOrderByCode(orderCode);
      if (order && order.paymentStatus !== 'paid') {
        await orderService.updatePaymentStatus(order.id, 'paid');
        await orderService.updateOrderStatus(order.id, 'confirmed');
      }
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Confirm payment fallback error:', error);
      res.status(500).json({ success: false });
    }
  }

  // FLASH SALE ADMIN SETUP
  async initFlashSale(req, res) {
    try {
      const { productId, quantity, startTimeMs, salePrice } = req.body;
      if (!productId || !quantity || !startTimeMs || !salePrice) {
         return res.status(400).json({ success: false, message: 'Thiếu thông tin (Sản phẩm, Số lượng, Thời gian, hoặc Giá Sale)' });
      }

      // Check Real Stock cross-microservice (product-service: port 3002 inside network or localhost)
      // Usually in Docker network, it's called 'product-service'. But since this might run locally or docker,
      // We will try reaching out. A simpler way is to assume it's running on identical host with port 3002.
      const productApiUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002/api/products';
      
      let product;
      try {
         const pRes = await axios.get(`${productApiUrl}/${productId}`);
         product = pRes.data.data;
      } catch (err) {
         return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại trong kho' });
      }

      if (quantity > product.stock) {
         return res.status(400).json({ 
            success: false, 
            message: `Số lượng sale vượt quá tồn kho (Tồn kho thực tế: ${product.stock})` 
         });
      }
      
      const key = `flash_sale:${productId}`;
      
      // Lưu thành bảng Hash
      await redisClient.hset(key, {
         stock: quantity,
         totalStock: quantity,
         startTime: startTimeMs,
         salePrice: salePrice
      });
      
      // Lưu lại con trỏ đang sale để public route biết
      await redisClient.set('flash_sale:active', productId);

      res.status(200).json({ 
         success: true, 
         message: `Đã thiết lập ${quantity} ${product.name} cho đợt Sale lúc ${new Date(startTimeMs).toLocaleString()}!` 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // GET ACTIVE FLASH SALE (PUBLIC)
  async getActiveFlashSale(req, res) {
    try {
      const productId = await redisClient.get('flash_sale:active');
      if (!productId) {
         return res.status(200).json({ success: true, data: null });
      }

      const key = `flash_sale:${productId}`;
      const data = await redisClient.hgetall(key);
      
      if (!data || Object.keys(data).length === 0) {
        return res.status(200).json({ success: true, data: null });
      }

      // Fetch Product Info
      let productInfo = null;
      const productApiUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002/api/products';
      try {
         const pRes = await axios.get(`${productApiUrl}/${productId}`);
         productInfo = pRes.data.data;
      } catch(e) {}

      res.status(200).json({ 
        success: true, 
        data: {
           id: productId,
           product: productInfo,
           stock: parseInt(data.stock),
           totalStock: parseInt(data.totalStock),
           startTime: parseInt(data.startTime),
           salePrice: parseInt(data.salePrice) || 0,
           currentTime: Date.now()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async buyFlashSale(req, res) {
    try {
      const { productId } = req.body;
      if (!productId) return res.status(400).json({ success: false, message: 'Thiếu productId' });

      const key = `flash_sale:${productId}`;
      const now = Date.now();
      
      // Execute Lua Script Atomic (1 KEY, 1 Thời gian truyền vào)
      const result = await redisClient.eval(deductStockScript, 1, key, now);

      if (result === 1) {
        // [C10K BULLMQ] Sinh vé giữ chỗ 1 phút
        const reservationId = uuidv4();
        await redisClient.set(`flash_sale_reserve:${reservationId}`, 'PENDING', 'EX', 120); // Redis tự xoá rác sau 2 phút (dư ra 1 xíu so với BullMQ)
        
        // Đẩy vào hàng đợi Đếm Ngược 1 phút (RabbitMQ Delay Queue) nếu người đó bỏ bom
        await publishDelayedReserve({ 
           reservationId, 
           productId 
        });

        return res.status(200).json({ 
           success: true, 
           message: 'Đã giật thành công 1 kiện hàng! Bạn có 1 phút để Thanh toán.',
           reservationId: reservationId 
        });
      } else if (result === -1) {
        return res.status(403).json({ success: false, message: 'Ăn gian! Sự kiện sale còn chưa mở cửa!' });
      } else {
        return res.status(400).json({ success: false, message: 'Chậm tay mất rồi! Hàng đã bán hết Sạch!' });
      }
    } catch (error) {
      console.error('Flash sale error:', error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ rớt mạng' });
    }
  }
}

module.exports = new OrderController();