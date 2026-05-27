import ws from 'k6/ws';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 5000 },  // Tăng tốc mượt mà lên 5,000 kết nối WebSockets trong 30s
    { duration: '30s', target: 10000 }, // Tiếp tục tăng lên 10,000 kết nối WebSockets trong 30s
    { duration: '90s', target: 10000 }, // Đạt đỉnh 10,000 kết nối WebSockets và giữ nguyên trong 90s
    { duration: '30s', target: 0 },     // Hạ nhiệt về 0 trong 30s
  ],
};

export default function () {
  const vuId = __VU;
  const url = `ws://gateway/socket.io/?EIO=4&transport=websocket&deviceId=k6_device_${vuId}`;

  // Mở kết nối WebSocket và giữ nó luôn mở cho đến khi hết lượt test để tránh TIME_WAIT cạn kiệt cổng kết nối (ports)
  ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      // Gửi gói tin '40' (Socket.io CONNECT) để báo hiệu kết nối Socket.io thành công!
      socket.send('40');
      
      // Giữ kết nối mở trong 100 giây (bao trọn đỉnh điểm 90s của load test)
      socket.setTimeout(function () {
        socket.close();
      }, 100000);
    });

    socket.on('error', function (e) {
      // Bỏ qua log lỗi kết nối để tránh làm nhiễu console
    });
  });

  // Mỗi VU sau khi kết nối sẽ nghỉ 110 giây để giữ kết nối socket sống ổn định, không chạy lại loop để tạo kết nối mới
  sleep(110);
}
