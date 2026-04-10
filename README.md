# Zero Phone (E-commerce C10K)

Dự án Hệ thống Thương mại Điện tử Backend Microservices có khả năng chịu tải cao (C10K - 10,000 Concurrent Users).

## 1. Yêu cầu Cài đặt (Prerequisites)
Để chạy dự án này trên máy, bạn cần cài đặt:
1. [Docker](https://www.docker.com/products/docker-desktop) và Docker Compose.
2. [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản 18 trở lên).
3. [Git](https://git-scm.com/).

---

## 2. Các Bước Chạy Dự Án

### Bước 1: Clone mã nguồn
Mở Terminal và clone toàn bộ cấu trúc dự án từ GitHub về máy:
```bash
git clone https://github.com/22635761/ecommerce-c10k.git
cd ecommerce-c10k
```

### Bước 2: Thiết lập Biến Môi trường (.env)
Bảo mật hệ thống đòi hỏi bạn phải thiết lập tệp `.env`. 
Làm theo các bước sau để sao chép từ tệp mẫu:
```bash
cp .env.example .env
```
*(Bạn có thể mở tệp `.env` vừa tạo và điền các khóa như STRIPE hay SMTP Gmail nếu muốn test chức năng tương ứng, nếu không hệ thống vẫn chạy cơ bản được).*

### Bước 3: Khởi động Trái Tim Hệ Thống (Backend Microservices)
Hệ thống sử dụng Docker Compose để tự động triển khai MongoDB, Redis, API Gateway và 4 dịch vụ (auth, product, cart, order). 
Tại thư mục gốc `ecommerce-c10k`, chạy lệnh:
```bash
docker compose up -d --build
```
*Lưu ý: Quá trình Build lần đầu có thể mất từ 3 - 5 phút tùy tốc độ mạng. Hãy đảm bảo Docker Desktop của bạn đang mở.*

### Bước 4: Khởi động Giao Diện (Frontend React)
Mở một cửa sổ Terminal MỚI, trỏ vào thư mục `frontend`:
```bash
cd frontend
npm install
npm start
```
Giao diện sẽ chạy tại đường dẫn: **http://localhost:3000**

---

## 3. Kiến Trúc Hệ Thống (Architecture)
*   **Frontend**: React.js, Tailwind CSS (Chạy độc lập port `3000`).
*   **API Gateway**: Node.js/Express. Định tuyến mọi API từ frontend đến backend (Port `8080`).
*   **Microservices Backend**: Tự động liên lạc nội bộ (Auth, Product, Cart, Order, Flash Sale...).
*   **Database & Cache**: MongoDB phân tán (Prisma ORM) và Redis Cache.

## 4. Kiểm Tra Tình Trạng Hệ Thống
Bạn có thể xem API Gateway và các dịch vụ chạy thế nào bằng cách:
*   Mở trình duyệt: `http://localhost:8080/api/products` (Test truy xuất sản phẩm gốc).
*   Giao diện người dùng: `http://localhost:3000`

> **Lỗi thường gặp**: Nếu Frontend hiện lỗi vòng xoay (Loading mãi mãi) khi ở trang chủ, vui lòng kiểm tra xem Docker Desktop đã báo xanh (Running) các Container hay chưa bằng lệnh `docker ps`.
