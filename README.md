# EMS - Hệ thống Quản lý Giáo dục (MVP)

Một giải pháp phần mềm toàn diện và hiện đại dành cho việc quản lý trường học và các cơ sở giáo dục. Nền tảng này cung cấp một hệ sinh thái hợp nhất để quản lý học sinh, điểm danh, điểm số, tài chính, nhân sự, thời khóa biểu, và tích hợp sẵn Trợ lý Trí tuệ Nhân tạo (AI).

## Các Tính năng Chính

### Quản lý Học sinh
- Hồ sơ học sinh đầy đủ bao gồm lịch sử học tập, hồ sơ y tế và kỷ luật.
- Tích hợp cổng thông tin dành cho phụ huynh để cập nhật theo thời gian thực.

### Hệ thống Điểm danh
- Theo dõi điểm danh nhanh chóng và bảo mật.
- Quét mã QR trên Ứng dụng Di động để điểm danh tức thì.
- Tự động hóa quy trình xin nghỉ phép và theo dõi vắng mặt.

### Tài chính & Kế toán
- Định dạng học phí và tạo hóa đơn tự động.
- Tích hợp VietQR để chuyển khoản ngân hàng và đối soát thanh toán liền mạch.
- Quản lý học bổng và các khoản giảm trừ.

### Nhân sự & Tiền lương
- Quản lý cán bộ nhân viên và giáo viên.
- Tính lương tự động dựa trên giờ dạy và hợp đồng.
- Chấm công và quản lý ngày phép.

### Học tập & Điểm số
- Hệ thống chấm điểm toàn diện với các công thức có thể tùy chỉnh.
- Theo dõi bài tập và nhiệm vụ về nhà.
- Tự động xuất bảng điểm.

### Thời khóa biểu
- Tự động tạo và quản lý thời khóa biểu thông minh.
- Cân bằng khối lượng giảng dạy của giáo viên.
- Quản lý sự kiện (kỳ thi, họp phụ huynh).

### Trợ lý AI Tích hợp
- Chatbot AI được tích hợp sẵn để hỗ trợ tra cứu thông tin hệ thống, trích xuất dữ liệu và tương tác theo ngữ cảnh.
- Trí tuệ nhân tạo (Google Gemini) chuyên biệt để tự động chấm điểm các bài tiểu luận, tự luận của học sinh dựa trên tiêu chí giáo viên đề ra.
- Phân tích dự đoán về kết quả học tập của học sinh.

## Kiến trúc Logic AI & Tích hợp Hệ thống
Phân hệ AI của EMS đóng vai trò như một bộ não trung tâm, kết nối luồng dữ liệu của toàn bộ nền tảng giáo dục thông qua các cơ chế sau:

1. **AI Chatbot Nhận thức Ngữ cảnh (RAG):** Thay vì là một chatbot thông thường, AI được cấp luồng truy cập (read-only) vào các API nội bộ (Internal API) của NestJS để lấy thông tin thực tế. Khi người dùng (Giáo viên, Quản trị viên) đặt câu hỏi (VD: "Điểm trung bình toán của lớp 10A1 là bao nhiêu?"), hệ thống AI tại Service Analytics (Python/FastAPI) sẽ phân tích câu hỏi, gửi request đến Backend NestJS để lấy dữ liệu bảng điểm, sau đó tổng hợp lại và trả về câu trả lời tự nhiên nhất.
2. **Chấm điểm Tự động Tiểu luận (Automated Essay Scoring):** Khi học sinh nộp bài tập dạng văn bản trên ứng dụng di động, dữ liệu bài làm cùng với yêu cầu đề bài và đáp án chuẩn (Rubric) được gửi tới AI Engine (tích hợp API Google Gemini 1.5 Pro). AI sẽ phân tích ngữ nghĩa, lối diễn đạt, độ bao quát ý của học sinh so với đáp án chuẩn, từ đó đưa ra mức điểm chính xác và lời nhận xét chi tiết cho từng bài.
3. **Bảo mật Dữ liệu AI:** Toàn bộ dữ liệu trao đổi giữa môi trường AI và cơ sở dữ liệu đều được mã hóa và giới hạn phạm vi truy cập (Context Window) chỉ trong nội hàm trường học, đảm bảo quyền riêng tư tuyệt đối cho dữ liệu của học sinh.

## Kiến trúc Hệ thống

Hệ thống được xây dựng dựa trên kiến trúc microservices hiện đại sử dụng chung một cơ sở dữ liệu nguyên khối trong giai đoạn MVP. Điều này đảm bảo tốc độ phát triển nhanh chóng trong khi vẫn giữ được khả năng mở rộng sau này.

* Backend: NestJS (TypeScript), Python (FastAPI cho Analytics/AI)
* Frontend (Web): React, TypeScript, Vite, Ant Design
* Frontend (Mobile): Flutter, Dart
* Cơ sở dữ liệu: PostgreSQL (quản lý qua Prisma ORM)
* Caching: Redis
* Message Queue: BullMQ
* Containerization: Docker & Docker Compose

## Hướng dẫn Cài đặt

### Yêu cầu hệ thống
- Node.js (phiên bản 18 trở lên)
- pnpm (phiên bản 8 trở lên)
- Docker & Docker Compose
- Flutter SDK (để phát triển ứng dụng di động)

### 1. Thiết lập Cơ sở dữ liệu
Khởi động các dịch vụ PostgreSQL và Redis bằng Docker Compose:
```bash
cd docker
docker-compose up -d
```

### 2. Cài đặt Thư viện (Dependencies)
Cài đặt tất cả các gói Node.js cần thiết cho toàn bộ hệ thống:
```bash
pnpm install
```

### 3. Biến Môi trường
Sao chép file .env.example thành .env ở thư mục gốc và cập nhật các thông tin xác thực cần thiết:
```bash
cp .env.example .env
```

### 4. Migrate Cơ sở dữ liệu
Chạy lệnh Prisma migrate để khởi tạo cấu trúc cho cơ sở dữ liệu:
```bash
pnpm --filter services/unified exec prisma migrate dev
```

### 5. Khởi động Ứng dụng

Backend (Unified Service API):
```bash
pnpm --filter ./services/unified run start:dev
```
*API hoạt động tại http://localhost:3000*
*Tài liệu Swagger UI tại http://localhost:3000/api/docs*

Frontend (Admin Dashboard):
```bash
pnpm --filter ./frontend/admin run dev
```
*Web App hoạt động tại http://localhost:5173*

Mobile App (Flutter):
```bash
cd mobile/ems_mobile
flutter run
```

## Bảo mật & Phân quyền
Hệ thống sử dụng JWT (JSON Web Tokens) để xác thực an toàn và RBAC (Phân quyền theo Vai trò) để quản lý quyền truy cập cho các loại người dùng khác nhau (Super Admin, Quản trị Trường học, Giáo viên, Học sinh, Phụ huynh).

## Bản quyền
Dự án này thuộc quyền sở hữu bởi Reilfer

---
PS: - không kinh phí thì chỉ thế này thôi, 
    - AI mà lỗi 429 thì tự thay key api từ AI studio nhen
    - Mọi loại tool hack, black mmo, hack, tut, bypass kyc, AI tự làm riêng bản không kiểm duyệt deepfake, fake id, tín dụng ăn cắp, id card nước ngoài, ...v.v đều có mặt tại t.me/Reilfer
    - Đại Ái Tiên Tôn - Vũ Hồng Phi
