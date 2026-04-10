const { connectRabbitMQ } = require('../config/queue');
const redisClient = require('../config/redis');
const { PrismaClient } = require('@prisma/client');
const productAPI = require('../services/productAPI');
const prisma = new PrismaClient();

console.log('[Worker] Bắt đầu khởi động các Worker xử lý Đơn Hàng Ngầm (RabbitMQ)...');

async function startConsumers() {
    const { channel } = await connectRabbitMQ();

    // 1. Worker xử lý Hủy Reservation (Thu hồi chỗ Flash Sale)
    channel.consume('reservation_ready_queue', async (msg) => {
        if (msg !== null) {
            try {
                const job = JSON.parse(msg.content.toString());
                const { reservationId, productId } = job;
                
                console.log(`[Worker] Kiểm tra Vé Giữ Chỗ Flash Sale: ${reservationId}`);
                const reserveStatus = await redisClient.get(`flash_sale_reserve:${reservationId}`);

                if (reserveStatus === 'PENDING') {
                    console.log(`[Worker] PHÁT HIỆN BỎ BOM TRANG CHECKOUT: ${reservationId}. Tiến hành trả lại hàng cho người khác!`);
                    await redisClient.del(`flash_sale_reserve:${reservationId}`);
                    await redisClient.hincrby(`flash_sale:${productId}`, 'stock', 1);
                } else {
                    console.log(`[Worker] Vé ${reservationId} đã sử dụng hợp lệ. Bỏ qua.`);
                }
                
                // Báo cho RabbitMQ biết là đã xử lý xong tin nhắn thành công
                channel.ack(msg);
            } catch (err) {
                console.error(`[Worker] Lỗi xử lý job reservation:`, err.message);
                // Từ chối (Nack) -> ko requeue nếu nó là lỗi logic do dev, requeue nếu do api lỗi (ở đây k API nào nên false)
                channel.nack(msg, false, false);
            }
        }
    });

    // 2. Worker xử lý Hủy Đơn Hàng chưa Thanh toán (10 Phút)
    channel.consume('order_ready_queue', async (msg) => {
        if (msg !== null) {
            try {
                const job = JSON.parse(msg.content.toString());
                const { orderId, isFlashSale, productId } = job;
                
                console.log(`[Worker] Kiểm tra trạng thái Thanh toán cúa Đơn hàng: ${orderId}`);
                
                const order = await prisma.order.findUnique({
                    where: { id: orderId }
                });

                if (order && order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled') {
                    console.log(`[Worker] ĐƠN HÀNG ${orderId} CHƯA THANH TOÁN (HẾT 10 PHÚT). Tiến hành HỦY ĐƠN!`);
                    
                    const updatedOrder = await prisma.order.update({
                        where: { id: orderId },
                        data: { orderStatus: 'cancelled' }
                    });

                    // Emit event cho Product Service hoàn kho (qua RabbitMQ)
                    const { publishInventoryCmd } = require('../config/queue');
                    await publishInventoryCmd({
                        action: 'restore',
                        items: updatedOrder.items
                    });
                    console.log(`[Worker] Đã báo RabbitMQ hoàn trả kho DB cho Đơn hàng bị Hủy ${orderId}`);

                    // Trả kho Flash Sale Redis (nếu có)
                    if (isFlashSale && productId) {
                        await redisClient.hincrby(`flash_sale:${productId}`, 'stock', 1);
                        console.log(`[Worker] Đã hoàn trả +1 hàng Flash Sale cho Sản phẩm ${productId}`);
                    }
                } else {
                    console.log(`[Worker] Đơn hàng ${orderId} an toàn (Đã thanh toán hoặc hoàn tất). Bỏ qua.`);
                }

                channel.ack(msg);
            } catch (err) {
                console.error(`[Worker] Lỗi xử lý job order:`, err.message);
                channel.nack(msg, false, false);
            }
        }
    });
}

// Khởi chạy Consumer
startConsumers();

module.exports = {};
