const amqp = require('amqplib');

let connection = null;
let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672';

// Khởi tạo kết nối RabbitMQ và Setup Dead Letter Exchanges (Hẹn giờ)
async function connectRabbitMQ() {
    try {
        if (!connection) {
            connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();

            // 1. Khai báo Exchange chính dùng cho các sự kiện đã "Chín" (Đã hết hạn/Đến lúc thực hiện)
            const DLX_EXCHANGE = 'ecommerce_dlx_exchange';
            await channel.assertExchange(DLX_EXCHANGE, 'direct', { durable: true });

            // 2. Setup Queue 1 Phút (Flash Sale Reservation)
            // - Gửi vào queue này, nó ngâm 60s, sau 60s nó đẩy sang DLX_EXCHANGE với routingKey 'reservation_ready'
            const RESERVATION_DELAY_QUEUE = 'reservation_delay_queue';
            await channel.assertQueue(RESERVATION_DELAY_QUEUE, {
                durable: true,
                deadLetterExchange: DLX_EXCHANGE,
                deadLetterRoutingKey: 'reservation_ready',
                messageTtl: 60000 // 60 giây
            });

            const RESERVATION_READY_QUEUE = 'reservation_ready_queue';
            await channel.assertQueue(RESERVATION_READY_QUEUE, { durable: true });
            await channel.bindQueue(RESERVATION_READY_QUEUE, DLX_EXCHANGE, 'reservation_ready');

            // 3. Setup Queue 10 Phút (Huỷ đơn Payment Pending)
            const ORDER_DELAY_QUEUE = 'order_delay_queue';
            await channel.assertQueue(ORDER_DELAY_QUEUE, {
                durable: true,
                deadLetterExchange: DLX_EXCHANGE,
                deadLetterRoutingKey: 'order_ready',
                messageTtl: 600000 // 10 phút = 600000ms
            });

            const ORDER_READY_QUEUE = 'order_ready_queue';
            await channel.assertQueue(ORDER_READY_QUEUE, { durable: true });
            await channel.bindQueue(ORDER_READY_QUEUE, DLX_EXCHANGE, 'order_ready');

            // 4. Setup Queue truyền thống cho Giao tiếp C10K sang Product Service (Không hẹn giờ)
            const INVENTORY_QUEUE = 'inventory_cmd_queue';
            await channel.assertQueue(INVENTORY_QUEUE, { durable: true });

            console.log('[RabbitMQ] Đã kết nối và setup Queues thành công!');
        }
        return { connection, channel };
    } catch (error) {
        console.error('[RabbitMQ] Lỗi kết nối:', error);
        // Trong môi trường docker, sẽ chờ và retry
        setTimeout(connectRabbitMQ, 5000);
    }
}

// Wrapper Publish cho Delay
async function publishDelayedReserve(payload) {
    if (!channel) await connectRabbitMQ();
    channel.sendToQueue('reservation_delay_queue', Buffer.from(JSON.stringify(payload)), {
        persistent: true
    });
}

async function publishDelayedOrderCancel(payload) {
    if (!channel) await connectRabbitMQ();
    channel.sendToQueue('order_delay_queue', Buffer.from(JSON.stringify(payload)), {
        persistent: true
    });
}

// Wrapper Publish cho Inventory
async function publishInventoryCmd(payload) {
    if (!channel) await connectRabbitMQ();
    channel.sendToQueue('inventory_cmd_queue', Buffer.from(JSON.stringify(payload)), {
        persistent: true
    });
}

const getChannel = async () => {
    if (!channel) await connectRabbitMQ();
    return channel;
};

module.exports = {
    connectRabbitMQ,
    getChannel,
    publishDelayedReserve,
    publishDelayedOrderCancel,
    publishInventoryCmd
};
