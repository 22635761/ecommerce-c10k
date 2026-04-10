const amqp = require('amqplib');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const redisClient = require('../config/redis');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672';

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

async function startRabbitMQConsumer() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        const INVENTORY_QUEUE = 'inventory_cmd_queue';
        await channel.assertQueue(INVENTORY_QUEUE, { durable: true });

        console.log('[RabbitMQ Consumer] Đã kết nối và đang lắng nghe luồng Inventory...');

        channel.consume(INVENTORY_QUEUE, async (msg) => {
            if (msg !== null) {
                try {
                    const job = JSON.parse(msg.content.toString());
                    const { action, items } = job;

                    if (!items || !Array.isArray(items) || items.length === 0) {
                        return channel.ack(msg); // Ignored empty payload
                    }

                    if (action === 'deduct') {
                        console.log(`[RabbitMQ] Bắt đầu trừ tồn kho cho ${items.length} mặt hàng`);
                        for (const item of items) {
                            // Bỏ qua check ở bước này vì đây là fire-and-forget qua Queue
                            await prisma.product.update({
                                where: { id: item.productId },
                                data: { stock: { decrement: item.quantity } }
                            });
                        }
                    } else if (action === 'restore') {
                        console.log(`[RabbitMQ] Bắt đầu hoàn kho cho ${items.length} mặt hàng`);
                        for (const item of items) {
                            await prisma.product.update({
                                where: { id: item.productId },
                                data: { stock: { increment: item.quantity } }
                            });
                        }
                    }

                    await invalidateProductCache();
                    channel.ack(msg); // Thành công
                } catch (error) {
                    console.error('[RabbitMQ] Lỗi xử lý Inventory:', error);
                    // Có thể retry bằng nack false, false nếu là lỗi không phục hồi được
                    channel.nack(msg, false, false);
                }
            }
        });
    } catch (error) {
        console.error('[RabbitMQ Consumer] Lỗi kết nối, thử lại sau 5s...', error);
        setTimeout(startRabbitMQConsumer, 5000);
    }
}

module.exports = startRabbitMQConsumer;
