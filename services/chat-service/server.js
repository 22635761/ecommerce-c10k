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
  pingTimeout: 600000,
  pingInterval: 600000,
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

const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Initialize Gemini
const geminiApiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let geminiModel = null;

if (geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(geminiApiKey);
    geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `Bạn là "Zero Phone AI" - Trợ lý ảo chính thức của cửa hàng điện thoại Zero Phone. 
Nhiệm vụ của bạn là hỗ trợ khách hàng tìm kiếm sản phẩm điện thoại trong cửa hàng, cung cấp chính sách đổi trả/bảo hành, và giúp khách hàng tra cứu trạng thái đơn hàng.
Hãy viết câu trả lời bằng tiếng Việt một cách lễ phép, lịch sự, ngắn gọn và hữu ích.
- Nếu khách hàng cần tìm sản phẩm, hãy gọi hàm getProducts.
- Nếu khách hàng hỏi về khuyến mãi, hãy gọi hàm getActiveDiscounts.
- Nếu khách hàng muốn kiểm tra các đơn hàng của họ, hãy gọi hàm getUserOrders.
- Nếu khách hàng hỏi những câu hỏi không liên quan đến điện thoại hay Zero Phone, hãy hướng dẫn họ quay lại chủ đề chính một cách tế nhị.
Khi giới thiệu sản phẩm hoặc voucher, hãy giải thích ngắn gọn rồi chỉ ra thông tin quan trọng. Các thông tin chi tiết (như ảnh, link) sẽ được hiển thị dưới dạng thẻ thông minh tự động phía dưới.`
    });
    console.log('[GEMINI] Gemini AI initialized successfully!');
  } catch (err) {
    console.error('[GEMINI] Failed to initialize Gemini:', err);
  }
} else {
  console.warn('[GEMINI] GEMINI_API_KEY is not defined in env variables.');
}

const getProductsDeclaration = {
  name: "getProducts",
  description: "Tìm kiếm hoặc lấy danh sách các điện thoại trong kho theo tên sản phẩm, danh mục, hoặc mức giá.",
  parameters: {
    type: "OBJECT",
    properties: {
      search: { type: "STRING", description: "Từ khóa tìm kiếm tên điện thoại (ví dụ: 'iphone', 'samsung')" },
      category: { type: "STRING", description: "Danh mục sản phẩm (ví dụ: 'iphone')" },
      minPrice: { type: "NUMBER", description: "Giá tối thiểu bằng VNĐ" },
      maxPrice: { type: "NUMBER", description: "Giá tối đa bằng VNĐ" }
    }
  }
};

const getUserOrdersDeclaration = {
  name: "getUserOrders",
  description: "Lấy tất cả các đơn hàng của khách hàng hiện tại để kiểm tra trạng thái và thông tin đơn hàng.",
  parameters: {
    type: "OBJECT",
    properties: {}
  }
};

const getActiveDiscountsDeclaration = {
  name: "getActiveDiscounts",
  description: "Lấy danh sách mã giảm giá, voucher đang hoạt động tại cửa hàng.",
  parameters: {
    type: "OBJECT",
    properties: {}
  }
};

const fetchProducts = async (args) => {
  try {
    const response = await axios.get('http://product-service:3002/api/products', { params: args });
    return response.data;
  } catch (err) {
    console.error('[GEMINI TOOL] Error fetching products:', err.message);
    return { success: false, data: [], message: 'Không thể truy cập dữ liệu sản phẩm.' };
  }
};

const fetchActiveDiscounts = async () => {
  try {
    const response = await axios.get('http://discount-service:3006/api/discounts/active');
    return response.data;
  } catch (err) {
    console.error('[GEMINI TOOL] Error fetching discounts:', err.message);
    return { success: false, data: [], message: 'Không thể truy cập dữ liệu khuyến mãi.' };
  }
};

const fetchUserOrders = async (token) => {
  if (!token) {
    return { success: false, message: 'Người dùng chưa đăng nhập.' };
  }
  try {
    const response = await axios.get('http://order-service:3004/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (err) {
    console.error('[GEMINI TOOL] Error fetching user orders:', err.message);
    return { success: false, data: [], message: 'Không thể truy cập dữ liệu đơn hàng.' };
  }
};

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
const aiChats = {}; // AI Chat memory
// Socket mapping
const adminSockets = new Set();
const userSockets = new Map(); // userId -> socketId

io.on('connection', async (socket) => {
  const deviceId = socket.handshake.query.deviceId;
  if (!deviceId || !deviceId.startsWith('k6_device')) {
    console.log(`[CHAT] Client connected: ${socket.id}`);
  }

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

      // Gửi số liệu trực tiếp tới client vừa kết nối (unicast) thay vì broadcast toàn hệ thống O(N^2)
      socket.emit('visitor_stats', { online, total });
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

  // AI Chat join
  socket.on('join_ai_chat', ({ userId, userName }) => {
    if (!userId) return;
    
    if (!aiChats[userId]) {
      aiChats[userId] = {
        userId,
        userName,
        messages: [
          {
            sender: 'ai',
            text: `Xin chào ${userName}! Tôi là Zero Phone AI 🤖 - Trợ lý mua sắm thông minh của bạn. Tôi có thể giúp bạn tìm kiếm điện thoại, kiểm tra đơn hàng hoặc tìm kiếm mã ưu đãi. Bạn muốn hỏi điều gì ạ?`,
            timestamp: Date.now()
          }
        ]
      };
    }
    
    console.log(`[CHAT-AI] User ${userName} (${userId}) joined AI chat.`);
    socket.emit('ai_chat_history', aiChats[userId].messages);
  });

  // AI Chat message send
  socket.on('send_ai_message', async (data) => {
    const { userId, text, token } = data;
    if (!userId || !text.trim()) return;

    if (!aiChats[userId]) {
      aiChats[userId] = { userId, userName: 'Khách hàng', messages: [] };
    }

    // Add user message to history
    const userMsg = {
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now()
    };
    aiChats[userId].messages.push(userMsg);
    socket.emit('receive_ai_message', userMsg);

    // Call Gemini
    if (!geminiModel) {
      const errorMsg = {
        sender: 'ai',
        text: 'Rất tiếc, dịch vụ Trợ lý AI đang tạm thời gián đoạn. Bạn vui lòng thử lại sau hoặc chuyển sang chat với Nhân viên hỗ trợ nhé!',
        timestamp: Date.now()
      };
      aiChats[userId].messages.push(errorMsg);
      socket.emit('receive_ai_message', errorMsg);
      return;
    }

    try {
      const geminiHistory = [];
      const recentMessages = aiChats[userId].messages.slice(-10);
      
      let isFirst = true;
      for (let i = 0; i < recentMessages.length - 1; i++) {
        const msg = recentMessages[i];
        if (msg.sender === 'user') {
          geminiHistory.push({
            role: 'user',
            parts: [{ text: msg.text }]
          });
          isFirst = false;
        } else if (msg.sender === 'ai' && !isFirst) {
          geminiHistory.push({
            role: 'model',
            parts: [{ text: msg.text }]
          });
        }
      }

      // Initialize chat session
      const chat = geminiModel.startChat({
        history: geminiHistory,
        tools: [
          {
            functionDeclarations: [
              getProductsDeclaration,
              getUserOrdersDeclaration,
              getActiveDiscountsDeclaration
            ]
          }
        ]
      });

      console.log(`[GEMINI] Sending user prompt: "${text}"`);
      let result = await chat.sendMessage(text);
      let responseText = '';
      let payload = null;

      const functionCalls = result.response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        const { name, args } = call;
        console.log(`[GEMINI] Function call requested: ${name} with args:`, args);

        let functionResult;
        if (name === "getProducts") {
          const apiRes = await fetchProducts(args);
          functionResult = apiRes;
          if (apiRes.success && apiRes.data && apiRes.data.length > 0) {
            payload = {
              type: 'products',
              data: apiRes.data.slice(0, 5)
            };
          }
        } else if (name === "getUserOrders") {
          if (!token) {
            functionResult = { success: false, message: 'Người dùng chưa đăng nhập. Hãy nhắc nhở người dùng đăng nhập bằng tài khoản trước.' };
          } else {
            const apiRes = await fetchUserOrders(token);
            functionResult = apiRes;
            if (apiRes.success && apiRes.data && apiRes.data.length > 0) {
              payload = {
                type: 'orders',
                data: apiRes.data
              };
            }
          }
        } else if (name === "getActiveDiscounts") {
          const apiRes = await fetchActiveDiscounts();
          functionResult = apiRes;
          if (apiRes.success && apiRes.data && apiRes.data.length > 0) {
            payload = {
              type: 'discounts',
              data: apiRes.data
            };
          }
        }

        // Send function response back to Gemini
        const secondResult = await chat.sendMessage([
          {
            functionResponse: {
              name: name,
              response: { result: functionResult }
            }
          }
        ]);
        responseText = secondResult.response.text();
      } else {
        responseText = result.response.text();
      }

      const aiMsg = {
        sender: 'ai',
        text: responseText,
        timestamp: Date.now(),
        payload: payload
      };

      aiChats[userId].messages.push(aiMsg);
      socket.emit('receive_ai_message', aiMsg);
    } catch (err) {
      console.error('[GEMINI] Error during chat completion:', err);
      const errorMsg = {
        sender: 'ai',
        text: 'Xin lỗi, tôi đã gặp sự cố nhỏ khi xử lý câu hỏi này. Bạn có thể hỏi lại hoặc hỏi câu hỏi khác được không ạ?',
        timestamp: Date.now()
      };
      aiChats[userId].messages.push(errorMsg);
      socket.emit('receive_ai_message', errorMsg);
    }
  });

  socket.on('disconnect', async () => {
    if (!deviceId || !deviceId.startsWith('k6_device')) {
      console.log(`[CHAT] Client disconnected: ${socket.id}`);
    }
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
                onlineUsersGauge.set(online);
                // Không broadcast toàn hệ thống ở đây để tránh nghẽn CPU khi lượng disconnect lớn
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

// Thao tác phát (broadcast) định kỳ số liệu truy cập cứ 3 giây một lần cho tất cả client
// Điều này giúp giảm đáng kể tải CPU và băng thông mạng từ O(N^2) xuống O(1)
setInterval(async () => {
  try {
    const online = parseInt(await redisClient.get('online_count') || 0);
    const total = parseInt(await redisClient.get('total_visits') || 1500);
    io.emit('visitor_stats', { online, total });
  } catch (err) {
    // Bỏ qua lỗi kết nối tạm thời
  }
}, 3000);

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
