# 📱 Zero Phone (E-commerce C10K System)

Dự án Hệ thống Thương mại Điện tử Kiến trúc **Microservices** có khả năng chịu tải cực lớn (**C10K - 10,000 kết nối đồng thời**), tích hợp các giải pháp thanh toán tự động, chat trực tuyến thời gian thực tích hợp Trí tuệ nhân tạo (AI), và hệ thống giám sát chỉ số (monitoring) doanh nghiệp chuẩn Enterprise.

---

## 🛠️ 1. Bản Đồ Công Nghệ & Cách Thức Sử Dụng Toàn Diện (Tech Stack Details)

Dưới đây là chi tiết toàn bộ các công nghệ cốt lõi được áp dụng trong dự án và cách chúng được sử dụng để giải quyết bài toán chịu tải lớn, bảo mật và trải nghiệm người dùng tối ưu:

### 1.1. Kiến Trúc Microservices & Giao Tiếp Hệ Thống (Distributed Architecture)
*   **Microservices Architecture (NodeJS & Express):**
    *   *Cách sử dụng:* Hệ thống được tách thành 6 dịch vụ độc lập chạy trong các container Docker riêng biệt:
        *   `auth-service` (Cổng 3001): Quản lý đăng ký, đăng nhập, cấp phát OTP qua email, phân quyền người dùng và phát hành JSON Web Tokens (JWT).
        *   `product-service` (Cổng 3002): Quản lý kho hàng, thông tin sản phẩm, thương hiệu và đồng bộ hóa tồn kho.
        *   `discount-service` (Cổng 3003): Quản lý mã giảm giá, tính toán mức chiết khấu cho đơn hàng.
        *   `cart-service` (Cổng 3005): Quản lý giỏ hàng tạm thời của khách hàng lưu trữ tối ưu.
        *   `order-service` (Cổng 3004): Quản lý thanh toán, hóa đơn, tích hợp giao vận GHN và tự động hóa thanh toán.
        *   `chat-service` (Cổng 3007): Xử lý luồng chat thời gian thực qua WebSockets giữa khách hàng và Admin, tích hợp AI hỗ trợ.
    *   *Lợi ích:* Đảm bảo tính cô lập (Fault Isolation) và khả năng mở rộng độc lập (Scalability). Nếu dịch vụ chat hay giỏ hàng gặp sự cố, khách hàng vẫn có thể xem sản phẩm và đặt hàng bình thường.
*   **API Gateway (Nginx):**
    *   *Cách sử dụng:* Chạy ở cổng `8080`, đóng vai trò là điểm tiếp nhận (Single Entry Point) duy nhất cho toàn bộ hệ thống. Định tuyến thông minh các API từ Frontend đến các dịch vụ Backend tương ứng dựa theo path (ví dụ: `/api/products` -> `product-service`).
    *   *Lợi ích:* Che giấu cấu trúc mạng nội bộ Docker, ngăn chặn tấn công trực diện vào microservices, xử lý CORS tập trung và phân phối tải mượt mà.
*   **Message Broker (RabbitMQ):**
    *   *Cách sử dụng:* 
        *   Xử lý giao tiếp bất đồng bộ (Event-Driven Architecture) giữa các dịch vụ. Khi đơn hàng được tạo, `order-service` gửi tin nhắn `order.created` tới RabbitMQ, `product-service` lắng nghe tin nhắn này để cập nhật kho hàng vĩnh viễn.
        *   Sử dụng **RabbitMQ Delayed Message Exchange** để xử lý "Tự động hủy đơn hàng quá hạn": Nếu sau 15 phút khách hàng không thanh toán trực tuyến, một message hết hạn sẽ kích hoạt quá trình tự động hủy đơn và hoàn kho.
    *   *Lợi ích:* Tránh tình trạng thắt nút cổ chai (bottleneck) khi có hàng ngàn yêu cầu ghi vào cơ sở dữ liệu cùng một thời điểm, giúp hệ thống hoạt động trơn tru.

### 1.2. Cơ Sở Dữ Liệu & Caching (Database & In-Memory Store)
*   **MongoDB (NoSQL) & Replica Set:**
    *   *Cách sử dụng:* Được cấu hình chạy dưới dạng Replica Set (`mongodb-repl`) gồm 3 nodes để tự động đồng bộ hóa dữ liệu và có khả năng tự động khôi phục lỗi (Automatic Failover). Lưu trữ dữ liệu đơn hàng, sản phẩm và người dùng.
    *   *Lợi ích:* Khả năng đọc/ghi tài liệu (document JSON) tốc độ cao, cấu trúc giỏ hàng và danh sách sản phẩm linh hoạt không bị gò bó bởi các liên kết bảng phức tạp của SQL truyền thống.
*   **Prisma ORM (Object-Relational Mapping):**
    *   *Cách sử dụng:* Trình kết nối cơ sở dữ liệu thế hệ mới cho Node.js, hoạt động như cầu nối type-safe giữa mã nguồn Javascript/Typescript với MongoDB thông qua định nghĩa Schema rõ ràng (`schema.prisma`).
    *   *Lợi ích:* Giúp thao tác với database an toàn, tự động đồng bộ schema (db push) và truy xuất dữ liệu cực kỳ tường minh, hạn chế tối đa lỗi runtime do sai lệch kiểu dữ liệu.
*   **Redis Cache (In-Memory Database):**
    *   *Cách sử dụng:*
        1.  *Caching sản phẩm:* Cache lại danh mục sản phẩm hot để tránh truy vấn trực tiếp vào MongoDB giúp giảm tải 90% lượng truy cập đọc.
        2.  *Atomic Stock Allocation:* Sử dụng các **LUA Script** chạy trực tiếp trên Redis để kiểm tra số lượng và trừ kho Flash Sale chỉ trong vài mili-giây với tính toàn vẹn tuyệt đối (ngăn chặn hoàn toàn lỗi Over-selling - bán quá số lượng kho hiện có khi tải cao).
        3.  *WebSocket State Store:* Lưu trữ thông tin kết nối và phiên làm việc thời gian thực của người dùng trong chat-service.

### 1.3. Giao Diện Người Dùng & Hoạt Ảnh (Frontend Stack)
*   **ReactJS (Create React App):**
    *   *Cách sử dụng:* Xây dựng ứng dụng Trang Độc Nhất (SPA) giúp khách hàng mua sắm mượt mà không bị tải lại trang. Tổ chức mã nguồn theo hướng component-driven chuyên nghiệp, quản lý trạng thái toàn cục qua `React Context` (`AuthProvider`, `CartProvider`).
*   **Tailwind CSS & Heroicons / React Icons:**
    *   *Cách sử dụng:* Thư viện CSS utility-first dùng để thiết kế toàn bộ hệ thống giao diện xanh lá đặc trưng của thương hiệu **Zero Phone** chuẩn chỉnh e-commerce, thiết kế responsive hoàn hảo cho cả điện thoại di động và máy tính.
*   **Framer Motion:**
    *   *Cách sử dụng:* Thư viện hoạt ảnh cao cấp cho React. Tạo hiệu ứng chuyển động mượt mà cho giỏ hàng nhanh (Slide-over Cart), các trạng thái hover tinh tế vào sản phẩm, và hiệu ứng mượt mà khi chuyển trang hay hiển thị modal.
*   **Axios:**
    *   *Cách sử dụng:* Thư viện HTTP client dùng để kết nối Frontend với Backend API. Cấu hình **Axios Interceptors** để tự động đính kèm Token JWT vào Header của mọi request và xử lý lỗi tập trung (Global Error Handler) như tự động đăng xuất khi Token hết hạn.
*   **Swiper JS & Leaflet:**
    *   *Cách sử dụng:* Swiper JS tạo các banner quảng cáo và thanh trượt sản phẩm mượt mà cảm ứng. Leaflet hỗ trợ hiển thị bản đồ trực quan hỗ trợ việc định vị vị trí giao nhận đơn hàng.

### 1.4. Tích Hợp Trí Tuệ Nhân Tạo & Dịch Vụ Đám Mây (AI & Cloud Services)
*   **Gemini AI API (@google/generative-ai):**
    *   *Cách sử dụng:* Tích hợp trực tiếp vào `chat-service`. Khi một khách hàng nhắn tin hỗ trợ vào hệ thống mà toàn bộ nhân viên tư vấn/admin đều đang ngoại tuyến (offline), chatbot AI tích hợp Gemini sẽ tự động kích hoạt. AI sẽ phân tích câu hỏi của khách hàng, tham chiếu danh mục sản phẩm và đưa ra câu trả lời tư vấn cực kỳ tự nhiên, thông minh chuẩn xác 24/7.
*   **Cloudinary SDK & Multer:**
    *   *Cách sử dụng:* Multer đóng vai trò là middleware nhận file hình ảnh sản phẩm được tải lên từ trang Admin. Backend sẽ chuyển tiếp hình ảnh này lên dịch vụ lưu trữ đám mây Cloudinary thông qua Cloudinary SDK, trả về URL hình ảnh chất lượng cao để hiển thị trên website.

### 1.5. Cổng Thanh Toán & Vận Chuyển (Payment & Delivery)
*   **Stripe SDK (@stripe/stripe-js & @stripe/react-stripe-js):**
    *   *Cách sử dụng:* Tích hợp thanh toán thẻ tín dụng/ghi nợ quốc tế (Visa/Mastercard) bảo mật cao qua Stripe Elements trực tiếp trên giao diện Checkout và xử lý capture tiền ở Backend `order-service`.
*   **SePay (Automated Bank Transfer QR):**
    *   *Cách sử dụng:* Cổng thanh toán chuyển khoản ngân hàng tự động dành cho cá nhân thông qua VietQR. Hệ thống tự động sinh mã QR động chứa đúng số tiền và nội dung chuyển khoản mã hóa riêng cho từng đơn hàng. Khi khách hàng quét mã chuyển khoản thành công, ngân hàng sẽ gửi Webhook (IPN) bảo mật đến `order-service`, hệ thống tự động duyệt đơn hàng sau 1 giây!
*   **Giao Hàng Nhanh (GHN API) & vn-provinces:**
    *   *Cách sử dụng:* Tích hợp trực tiếp API chính thức của GHN để tự động đồng bộ hóa danh sách Phường/Xã/Quận/Huyện toàn Việt Nam thông qua thư viện `vn-provinces`, tự động tính toán phí vận chuyển chính xác theo khoảng cách địa lý, trọng lượng hàng hóa và hiển thị thời gian shipper giao hàng dự kiến.

### 1.6. Giám Sát Chỉ Số & Load Test C10K (DevOps & Monitoring)
*   **Socket.io (WebSockets):**
    *   *Cách sử dụng:* Thiết lập kênh truyền dữ liệu hai chiều liên tục giữa client và server phục vụ live chat và đo lường trực tiếp số người dùng đang truy cập trực tuyến (Active Live Users Counter) cập nhật ở Footer hệ thống.
*   **Prometheus & prom-client:**
    *   *Cách sử dụng:* Prometheus định kỳ thu thập (scrape) các chỉ số CPU, RAM, Network, số lượng request HTTP, và thời gian phản hồi từ endpoint `/metrics` của các dịch vụ backend thông qua thư viện `prom-client`.
*   **Grafana:**
    *   *Cách sử dụng:* Kết nối cơ sở dữ liệu của Prometheus để vẽ nên biểu đồ trực quan hóa dữ liệu (Dashboard "Visitor Tracking"). Giúp quản trị viên theo dõi toàn diện sức khỏe hệ thống thời gian thực.
*   **k6 (Grafana k6):**
    *   *Cách sử dụng:* Công cụ kiểm thử hiệu năng chịu tải cao. Script k6 giả lập **10,000 kết nối WebSockets đồng thời** chạy dồn dập vào cổng API Gateway để kiểm chứng khả năng chịu tải C10K của chat-service dưới áp lực thực tế.
*   **Docker & Docker Compose:**
    *   *Cách sử dụng:* Đóng gói toàn bộ cơ sở dữ liệu, hàng đợi, cache, API gateway, 6 microservices backend, frontend, Prometheus và Grafana vào các container cô lập. Giúp khởi chạy toàn bộ dự án ăn khớp 100% chỉ bằng một câu lệnh duy nhất.
*   **AWS (Amazon Web Services) - Lộ trình triển khai doanh nghiệp:**
    *   *Chi tiết kiến trúc:*
        - **Amazon ECS/EKS (Kubernetes):** Quản lý điều phối chạy các container microservices tự động co giãn theo tải (Auto Scaling).
        - **AWS Application Load Balancer (ALB):** Định tuyến lưu lượng truy cập và cân bằng tải thay thế Nginx trên cloud.
        - **Amazon ElastiCache:** Cluster Redis chịu tải cực cao.
        - **Amazon DocumentDB (Tương thích MongoDB):** Đảm bảo cơ sở dữ liệu phân tán chuẩn doanh nghiệp.
        - **AWS S3 & CloudFront:** Lưu trữ file static của React Frontend và phân phối nhanh toàn cầu qua CDN.

---

## 🏗️ 2. Sơ Đồ Kiến Trúc Hệ Thống (System Architecture)

Dưới đây là mô hình luồng dữ liệu đi từ Client thông qua API Gateway, phân phối đến các Microservices và cách các dịch vụ tương tác với Database, Message Broker, Cache và hệ thống giám sát:

```mermaid
flowchart TD
    subgraph Client ["🖥️ Môi trường Client (Frontend)"]
        FE["ReactJS SPA App (Cổng 3000)"]
    end

    subgraph Gateway ["🚪 API Gateway"]
        NGX["Nginx Proxy (Cổng 8080)"]
    end

    subgraph Microservices ["⚙️ Hệ thống Backend Microservices"]
        AUTH["auth-service (Cổng 3001)"]
        PROD["product-service (Cổng 3002)"]
        DISC["discount-service (Cổng 3003)"]
        ORDER["order-service (Cổng 3004)"]
        CART["cart-service (Cổng 3005)"]
        CHAT["chat-service (Cổng 3007)"]
    end

    subgraph Brokers ["📬 Message Broker & Realtime Channel"]
        RABBIT["RabbitMQ (Event Queues)"]
        SOCKET["Socket.io (WebSockets)"]
    end

    subgraph Storage ["💾 Hệ thống Dữ Liệu & Bộ Nhớ Đệm"]
        MONGO["MongoDB Replica Set"]
        REDIS["Redis Cache & Stock Lock"]
    end

    subgraph Monitor ["📊 Monitoring & Testing"]
        K6["k6 (Load Testing C10K)"]
        PROM["Prometheus (Metrics DB)"]
        GRAF["Grafana (Realtime Charts)"]
    end

    %% Connections
    FE -->|HTTP Requests| NGX
    NGX -->|/api/auth| AUTH
    NGX -->|/api/products| PROD
    NGX -->|/api/discount| DISC
    NGX -->|/api/orders| ORDER
    NGX -->|/api/cart| CART
    FE <==>|WebSockets Live Chat / Stats| CHAT

    %% Internal Communication
    ORDER <-->|Prisma ORM| MONGO
    PROD <-->|Prisma ORM| MONGO
    AUTH <-->|Prisma ORM| MONGO
    DISC <-->|Prisma ORM| MONGO
    CART <-->|Prisma ORM| MONGO
    
    ORDER <-->|Read/Write Cache| REDIS
    PROD <-->|Read/Write Cache| REDIS
    
    ORDER -->|Publish Event: order.created| RABBIT
    RABBIT -->|Consume Event: update.stock| PROD
    
    %% Monitoring
    PROM -->|Collect Metrics| NGX
    PROM -->|Collect Metrics| Microservices
    GRAF -->|Visualize| PROM
    K6 -->|Load Test Simulation| NGX
```

---

## 🏃‍♂️ 3. Hướng Dẫn Chạy Toàn Bộ Hệ Thống (Local Setup)

### Bước 1: Clone mã nguồn
```bash
git clone https://github.com/22635761/ecommerce-c10k.git
cd ecommerce-c10k
```

### Bước 2: Thiết lập tệp cấu hình bảo mật (`.env`)
```bash
cp .env.example .env
```

### Bước 3: Khởi chạy Microservices & Database (Docker Compose)
Tại thư mục gốc của dự án, chạy lệnh:
```bash
docker compose up -d --build
```
*Lệnh này sẽ tự động tải các image hệ điều hành, cài đặt dependencies, biên dịch mã nguồn và khởi động tất cả dịch vụ.*

### Bước 4: Khởi động Giao Diện (React Frontend)
Mở một Terminal mới, di chuyển vào thư mục `frontend` và khởi động:
```bash
cd frontend
npm install
npm start
```
Giao diện bán hàng Zero Phone sẽ chạy trực tiếp tại: **[http://localhost:3000](http://localhost:3000)**.

---

## 📊 4. Hướng Dẫn Chạy Thử Load Test C10K & Xem Chỉ Số

Hệ thống đã tích hợp sẵn k6 và Grafana Dashboard để bạn trình diễn khả năng chịu tải **10,000 kết nối WebSockets đồng thời**:

1. **Khởi chạy k6 Load Test:**
   ```bash
   docker compose --profile tools run --rm k6
   ```
2. **Xem biểu đồ Real-time trên Grafana:**
   - Truy cập **[http://localhost:3030](http://localhost:3030)** (Tài khoản/Mật khẩu mặc định: `admin` / `admin`).
   - Mở dashboard **"Visitor Tracking"** để chứng kiến con số kết nối tăng mạnh mẽ lên mốc 10,000 người dùng trực tuyến đồng thời cực kỳ mãn nhãn!

---

## 🎓 5. Cẩm Nang Trình Bày & Trả Lời Câu Hỏi Hội Đồng (Presentation & Interview Q&A)

Dưới đây là bộ khung câu hỏi và cách trả lời chuẩn kiến thức chuyên môn giúp bạn tự tin đạt điểm tối đa khi bảo vệ đồ án/trình bày dự án trước Hội đồng chấm thi:

### Câu 1: Tại sao bạn lại chọn kiến trúc Microservices thay vì Monolith (Đơn khối)?
*   **Trả lời:** 
    *   *Cô lập lỗi (Fault Isolation):* Trong hệ thống thương mại điện tử, các tính năng như Chat hay Giỏ hàng có tần suất truy cập rất cao nhưng không được phép làm ảnh hưởng đến luồng xem sản phẩm và Thanh toán. Nếu Chat bị sập, dịch vụ Order vẫn hoạt động bình thường.
    *   *Khả năng co giãn độc lập (Independent Scaling):* Dịch vụ Product và Chat chịu tải lớn nhất nên có thể scale lên nhiều container chạy song song, trong khi dịch vụ Discount hay Auth ít chịu tải hơn có thể giữ nguyên để tiết kiệm tài nguyên.
    *   *Tính linh hoạt công nghệ:* Mỗi service có thể viết bằng một ngôn ngữ hoặc thư viện khác nhau (ví dụ: Chat dùng WebSocket chuyên biệt, Product dùng caching nâng cao).

### Câu 2: Làm thế nào hệ thống của bạn chịu được tải 10,000 người dùng đồng thời (C10K)?
*   **Trả lời:** Em đã giải quyết bài toán chịu tải ở cả 3 tầng:
    1.  **Tầng Caching (Redis):** Thay vì cho 10,000 người truy cập thẳng vào database MongoDB để đọc thông tin sản phẩm (gây sập DB), em lưu thông tin sản phẩm vào bộ đệm RAM của Redis. Giảm tải 90% truy vấn đọc.
    2.  **Tầng Hàng Đợi (RabbitMQ):** Khi có lượng mua cực lớn (Flash Sale), em không ghi đơn hàng trực tiếp xuống database một cách đồng bộ. Em đưa yêu cầu mua hàng vào hàng đợi RabbitMQ để xử lý bất đồng bộ tuần tự, tránh nghẽn luồng (bottleneck).
    3.  **Atomic Stock Allocation (LUA Script):** Việc trừ kho hàng được thực hiện bằng LUA script chạy nguyên tử (atomic) ngay trong Redis để tránh việc bán quá số lượng kho (Over-selling) chỉ mất chưa đầy 2ms cho mỗi yêu cầu.

### Câu 3: Hãy giải thích cách thức hoạt động của tính năng Thanh toán Tự động SePay (VietQR)?
*   **Trả lời:** Luồng hoạt động như sau:
    1.  Khách hàng tiến hành checkout, hệ thống sinh ra một mã QR VietQR động.
    2.  Mã QR này chứa: Mã ngân hàng của chủ shop, Số tài khoản, Số tiền cần thanh toán chính xác, và một **Mã nội dung chuyển khoản duy nhất** (ví dụ: `DH1002`).
    3.  Khách hàng quét mã trên app ngân hàng của họ và ấn chuyển khoản mà không cần nhập thủ công bất kỳ thông tin nào.
    4.  Khi tài khoản ngân hàng của chủ shop nhận được tiền, dịch vụ SePay nhận biến động số dư và bắn một tín hiệu bảo mật (Webhook IPN) về API `/api/orders/webhook/sepay` của chúng ta.
    5.  Backend kiểm tra mã nội dung chuyển khoản trùng khớp `DH1002` và số tiền chính xác, lập tức đổi trạng thái đơn hàng thành `Paid` và thông báo tới client qua WebSockets. Quá trình tự động hoàn thành trong 1 giây mà không cần con người đối soát.

### Câu 4: Trí tuệ nhân tạo Gemini AI được tích hợp như thế nào trong dịch vụ Chat?
*   **Trả lời:** Em sử dụng bộ thư viện chính thức `@google/generative-ai` để tích hợp AI thông minh vào Chat:
    1.  Khi khách hàng gửi tin nhắn, `chat-service` sẽ kiểm tra xem có Admin nào đang online để tiếp nhận cuộc trò chuyện hay không.
    2.  Nếu không có Admin nào trực trực tuyến, hệ thống sẽ kích hoạt Gemini AI.
    3.  Hệ thống sẽ nạp ngữ cảnh (System Prompt) cho Gemini AI, hướng dẫn nó đóng vai trò là "Nhân viên tư vấn Zero Phone lịch sự, am hiểu sản phẩm".
    4.  Mỗi câu hỏi của khách hàng sẽ được gửi kèm danh mục sản phẩm hiện có để AI trả lời chuẩn xác thông tin kỹ thuật, giá bán và đưa ra gợi ý sản phẩm phù hợp nhất với nhu cầu người dùng.

### Câu 5: Hệ thống giám sát (Monitoring) với Prometheus & Grafana có vai trò gì?
*   **Trả lời:** Prometheus hoạt động theo cơ chế **Pulling**, định kỳ mỗi 5-15 giây sẽ gọi tới endpoint `/metrics` của các container để lấy các chỉ số phần cứng (CPU, RAM) và chỉ số phần mềm (số request/giây, tỷ lệ lỗi 5xx). Grafana đóng vai trò trực quan hóa, vẽ các chỉ số đó thành các đồ thị trực quan. Nhờ đó, đội ngũ vận hành hệ thống có thể phát hiện ngay lập tức microservice nào đang bị quá tải, bộ nhớ RAM có bị rò rỉ (memory leak) hay không để kịp thời nâng cấp hoặc sửa lỗi trước khi hệ thống sập hoàn toàn.
