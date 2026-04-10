const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('redis');
const promClient = require('prom-client');

// Prometheus Registry setup
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const onlineUsersGauge = new promClient.Gauge({
  name: 'ecommerce_online_users',
  help: 'Number of currently active unique devices/users',
  registers: [register]
});

const totalVisitsGauge = new promClient.Gauge({
  name: 'ecommerce_total_visits',
  help: 'Total cumulative number of visits',
  registers: [register]
});

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Redis setup for tracking total visits
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => console.error('[REDIS] Client Error', err));
redisClient.connect().then(async () => {
  console.log('[REDIS] Connected successfully to Redis tracking DB.');
  
  // DỌN DẸP DỮ LIỆU RÁC KHI RESTART SERVER
  // Vì nếu Node bị sập, các Socket cũ mất mà chưa kịp gọi lệnh "disconnect" giảm đi 1
  // Nên ta phải flush sách đếm tab hiện tại trên node này để đếm lại từ đầu!
  await redisClient.del('device_tabs');
  await redisClient.set('online_count', 0);

  // Initialize total visits if not exists
  const exists = await redisClient.get('total_visits');
  if (!exists) {
    await redisClient.set('total_visits', 1500); 
  }
  
  // Set initial metrics
  const total = await redisClient.get('total_visits');
  totalVisitsGauge.set(parseInt(total || 1500));
  onlineUsersGauge.set(0);
}).catch(console.error);

const PORT = process.env.PORT || 3007;

// In-memory data structures for fast prototyping
// Format: 
// chats[userId] = { 
//    userId: 'user_id',
//    userName: 'John Doe',
//    messages: [{ sender: 'user|admin', text: 'Hello', timestamp: 12345 }],
//    hasUnreadAdmin: true 
// }
const chats = {}; 
// Socket mapping
const adminSockets = new Set();
const userSockets = new Map(); // userId -> socketId

io.on('connection', async (socket) => {
  console.log(`[CHAT] Client connected: ${socket.id}`);
  
  const deviceId = socket.handshake.query.deviceId;

  if (deviceId) {
    try {
      // HINCRBY là Lệnh Nguyên tử (Atomic). Nếu có 7 Sockets từ cùng 1 thiết bị lao vào cùng lúc (do Bug React)
      // thì Redis sẽ xếp hàng và gán tuần tự: 1, 2, 3, 4, 5, 6, 7. 
      // Chỉ duy nhất 1 Socket bắt được số 1, loại bỏ hoàn toàn lỗi Race Condition.
      const tabsCount = await redisClient.hIncrBy('device_tabs', deviceId, 1);
      
      let online = parseInt(await redisClient.get('online_count') || 0);
      let total = parseInt(await redisClient.get('total_visits') || 1500);

      if (tabsCount === 1) {
        // Khi quay về 1, ta kiểm tra xem họ là TRUY CẬP MỚI hay chỉ là CHỚP TẮT (Reload)
        const inGracePeriod = await redisClient.get(`grace:${deviceId}`);
        
        if (inGracePeriod) {
          // Chỉ là tải lại trang! Xóa cờ ân hạn, KHÔNG TĂNG LƯỢT MỚI!
          await redisClient.del(`grace:${deviceId}`);
        } else {
          // Người dùng hoàn toàn mới!
          online = await redisClient.incr('online_count');
          total = await redisClient.incr('total_visits');
          onlineUsersGauge.set(online);
          totalVisitsGauge.set(total);
        }
      }

      io.emit('visitor_stats', { online, total });
    } catch (err) {
      console.error('[REDIS] Tăng biến theo dõi lỗi', err);
    }
  }

  // Admin join
  socket.on('join_admin', () => {
    adminSockets.add(socket.id);
    console.log(`[CHAT] Admin joined. Total admins: ${adminSockets.size}`);
    socket.emit('admin_init_chats', Object.values(chats));
  });

  // User join
  socket.on('join_chat', ({ userId, userName }) => {
    if (!userId) return;
    
    userSockets.set(userId, socket.id);
    socket.userId = userId;

    if (!chats[userId]) {
      chats[userId] = {
        userId,
        userName,
        messages: [],
        hasUnreadAdmin: true
      };
      io.to([...adminSockets]).emit('admin_new_chat', chats[userId]);
    } else {
      chats[userId].userName = userName;
    }

    console.log(`[CHAT] User ${userName} (${userId}) joined chat.`);
    socket.emit('chat_history', chats[userId].messages);
  });

  // User send msg
  socket.on('send_message', (data) => {
    const { userId, text } = data;
    if (!userId || !text.trim()) return;

    if (!chats[userId]) return;

    const message = {
      sender: 'user',
      text,
      timestamp: Date.now()
    };
    
    chats[userId].messages.push(message);
    chats[userId].hasUnreadAdmin = true;

    io.to([...adminSockets]).emit('admin_receive_message', { userId, message });
    socket.emit('receive_message', message);
  });

  // Admin send msg
  socket.on('admin_send_message', (data) => {
    const { userId, text } = data;
    if (!userId || !text.trim() || !chats[userId]) return;

    const message = {
      sender: 'admin',
      text,
      timestamp: Date.now()
    };
    
    chats[userId].messages.push(message);
    chats[userId].hasUnreadAdmin = false;

    socket.emit('admin_receive_message', { userId, message });

    const targetSocketId = userSockets.get(userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive_message', message);
    }
  });

  // Admin read
  socket.on('admin_mark_read', ({ userId }) => {
    if (chats[userId]) {
      chats[userId].hasUnreadAdmin = false;
      io.to([...adminSockets]).emit('admin_chats_updated', Object.values(chats));
    }
  });

  socket.on('disconnect', async () => {
    console.log(`[CHAT] Client disconnected: ${socket.id}`);
    if (adminSockets.has(socket.id)) {
      adminSockets.delete(socket.id);
    }
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }
    
    if (deviceId) {
      try {
        const tabsCount = await redisClient.hIncrBy('device_tabs', deviceId, -1);

        // THUẬT TOÁN DEBOUNCE C10K:
        if (tabsCount <= 0) {
          // Đánh dấu cờ Ân hạn thời gian 5 giây
          await redisClient.setEx(`grace:${deviceId}`, 5, "1");

          setTimeout(async () => {
            try {
              const currentTabs = Number(await redisClient.hGet('device_tabs', deviceId));
              
              // Nếu thực sự họ đi mất (vẫn <= 0)
              if (currentTabs <= 0) {
                await redisClient.hDel('device_tabs', deviceId); 
                await redisClient.del(`grace:${deviceId}`);
                let online = await redisClient.decr('online_count');
                if (online < 0) {
                  online = 0;
                  await redisClient.set('online_count', 0);
                }
                let total = parseInt(await redisClient.get('total_visits') || 1500);
                onlineUsersGauge.set(online);
                io.emit('visitor_stats', { online, total });
              }
            } catch (e) {
              console.error(e);
            }
          }, 3000); 
        }
      } catch (err) {
         console.error('[REDIS] Lỗi giảm truy cập: ', err);
      }
    }
  });
});

app.get('/health', (req, res) => res.json({ status: 'OK', service: 'chat-service' }));

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

server.listen(PORT, () => {
  console.log(`💬 Chat Service running on port ${PORT}`);
});
