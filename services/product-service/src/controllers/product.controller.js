const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const redisClient = require('../config/redis');

// Cache Invalidation Utility: Dọn dẹp rác khi có dữ liệu mới
const invalidateProductCache = async () => {
  try {
    const keys = await redisClient.keys('product*');
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[CACHE] Flushed ${keys.length} product keys from Redis.`);
    }
  } catch (err) {
    console.error('[CACHE ERR] Failed to invalidate product caches:', err);
  }
};

const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sortBy } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit) : 0;

    // Build cache key from all params
    const cacheKey = `products:${search||''}:${category||''}:${minPrice||''}:${maxPrice||''}:${sortBy||''}:p:${page}:l:${limit}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({ success: true, ...JSON.parse(cachedData), source: 'cache' });
    }

    // Build where clause
    let whereClause = {};
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }
    if (category && category !== 'all') {
      whereClause.category = { equals: category, mode: 'insensitive' };
    }
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    // Build order clause
    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price_asc')  orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'rating')     orderBy = { rating: 'desc' };
    if (sortBy === 'newest')     orderBy = { createdAt: 'desc' };

    let products, totalRecords, totalPages = 1;

    if (limit > 0) {
      const skip = (page - 1) * limit;
      const [count, items] = await prisma.$transaction([
        prisma.product.count({ where: whereClause }),
        prisma.product.findMany({ where: whereClause, skip, take: limit, orderBy })
      ]);
      products = items;
      totalRecords = count;
      totalPages = Math.ceil(totalRecords / limit);
    } else {
      products = await prisma.product.findMany({ where: whereClause, orderBy });
      totalRecords = products.length;
    }

    const payload = { data: products, pagination: { currentPage: page, limit, totalRecords, totalPages } };
    await redisClient.setex(cacheKey, 300, JSON.stringify(payload)); // 5 phút (filter thay đổi nhiều hơn)

    res.status(200).json({ success: true, ...payload, source: 'database' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `product:detail:${id}`;

    // 1. Check Cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedData),
        source: 'cache'
      });
    }

    // 2. Fetch from DB
    const product = await prisma.product.findUnique({
      where: { id }
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // 3. Set Cache (TTL 1 Giờ)
    await redisClient.setex(cacheKey, 3600, JSON.stringify(product));

    res.status(200).json({
      success: true,
      data: product,
      source: 'database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Lấy sản phẩm theo category
const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const cacheKey = `products:category:${category}`;

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedData),
        source: 'cache'
      });
    }

    const products = await prisma.product.findMany({
      where: { category }
    });
    
    await redisClient.setex(cacheKey, 3600, JSON.stringify(products));

    res.status(200).json({
      success: true,
      data: products,
      source: 'database'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Thêm sản phẩm mới
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const newProduct = await prisma.product.create({
      data: productData
    });

    // CACHE INVALIDATION
    await invalidateProductCache();

    res.status(201).json({
      success: true,
      data: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: productData
    });

    // CACHE INVALIDATION
    await invalidateProductCache();

    res.status(200).json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id }
    });

    // CACHE INVALIDATION
    await invalidateProductCache();

    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Trừ tồn kho (Sử dụng lúc User ấn Đặt Hàng)
const deductStock = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách sản phẩm trống' });
    }

    // 1. Tiến hành trừ kho nguyên tử (Atomic Deduction) sử dụng MongoDB Transaction
    // Ngăn chặn race-condition khi nhiều người giật cùng 1 lúc
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const result = await tx.product.updateMany({
          where: { 
            id: item.productId,
            stock: { gte: item.quantity } // Chỉ trừ khi còn ĐỦ hàng
          },
          data: { 
            stock: { decrement: item.quantity } 
          }
        });

        if (result.count === 0) {
          // Bắn ra lỗi sẽ cuộn lại (rollback) toàn bộ các phần tử đã trừ trước đó trong vòng lặp này
          throw new Error(`Kho không đủ hàng cho sản phẩm (Mã SP: ${item.productId})! Đã có người nhanh tay hơn.`);
        }
      }
    });

    await invalidateProductCache();
    
    res.status(200).json({ success: true, message: 'Đã trừ kho thành công' });
  } catch (error) {
    console.error('Deduct stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cộng tồn kho (Sử dụng lúc huỷ đơn hàng)
const restoreStock = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách sản phẩm trống' });
    }

    // Tiến hành hoàn kho
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } }
      });
    }

    await invalidateProductCache();
    
    res.status(200).json({ success: true, message: 'Đã hoàn kho thành công' });
  } catch (error) {
    console.error('Restore stock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách Review của sản phẩm
const getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Viết đánh giá & Upload Ảnh
const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images, userName } = req.body;
    
    // Lấy thông tin từ JWT đã giải mã ở bước authMiddleware
    const actualUserId = req.user.userId || req.user.id;
    const actualUserName = userName || req.user.name || req.user.email || 'Khách hàng';
    const ratingNum = parseInt(rating) || 5;
    const imageUrls = Array.isArray(images) ? images : [];

    // 2. Chạy ghi hệ thống vào DB thông qua Transaction
    await prisma.$transaction(async (tx) => {
      // 2a. Tạo biến Review
      await tx.review.create({
        data: {
          productId: id,
          userId: actualUserId,
          userName: actualUserName,
          rating: ratingNum,
          comment: comment || '',
          images: imageUrls
        }
      });

      // 2b. Lấy toàn bộ rating để tính toán lại điểm số Product
      const allReviews = await tx.review.findMany({
        where: { productId: id },
        select: { rating: true }
      });
      
      const totalReviews = allReviews.length;
      const averageRating = totalReviews === 0 
        ? ratingNum 
        : allReviews.reduce((sum, rw) => sum + rw.rating, 0) / totalReviews;

      // 2c. Update Product
      await tx.product.update({
        where: { id },
        data: {
          rating: parseFloat(averageRating.toFixed(1)),
          reviews: totalReviews
        }
      });
    });

    // 3. Xoá cache Product để Web cập nhật ngay sao mới
    await invalidateProductCache();

    res.status(201).json({
      success: true,
      message: 'Đã thêm đánh giá thành công'
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin trả lời đánh giá
const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { adminReply } = req.body;

    if (!adminReply || !adminReply.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        adminReply: adminReply.trim(),
        adminReplyAt: new Date()
      }
    });

    // Xoá bộ đệm của sản phẩm
    await invalidateProductCache();

    res.status(200).json({
      success: true,
      data: updatedReview,
      message: 'Đã phản hồi đánh giá thành công'
    });
  } catch (error) {
    console.error('Admin reply error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
  deductStock,
  restoreStock,
  getReviews,
  addReview,
  replyToReview
};
