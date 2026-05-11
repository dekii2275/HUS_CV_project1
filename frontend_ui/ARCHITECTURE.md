# ITMS Frontend Architecture Guide

Tài liệu này giải thích cấu trúc thư mục và quy tắc tổ chức code của phần Frontend ITMS, giúp AI Assistant và các nhà phát triển duy trì tính nhất quán.

## 1. Cấu trúc Thư mục (`src/`)

```text
src/
├── api/              # Chứa các Axios instance, định nghĩa base URL và cấu hình kết nối FastAPI.
├── components/       # Chứa các thành phần giao diện tái sử dụng.
│   ├── common/       # Các UI components cơ bản (Button, Card, Badge, Input...).
│   ├── dashboard/    # Các widget và biểu đồ chuyên biệt cho màn hình giám sát.
│   └── layout/       # Các thành phần khung của ứng dụng (Sidebar, TopBar, Layout chung).
├── context/          # Quản lý State toàn cục bằng React Context (Language, Auth, Location...).
├── hooks/            # Chứa các Custom Hooks (useTrafficData, useWebSocket, useAuth...).
├── lib/              # Chứa cấu hình các thư viện bên thứ ba (Firebase, ChartJS config...).
├── pages/            # Các trang chính của ứng dụng. Hạn chế viết logic nặng ở đây.
├── services/         # Chứa logic nghiệp vụ và các API call cụ thể (geminiService, cameraService...).
├── types/            # Định nghĩa các TypeScript interfaces và types cho toàn dự án.
├── utils/            # Các hàm tiện ích thuần túy (formatDate, calculateDistance...).
├── constants.ts      # Chứa các hằng số hệ thống (API endpoints, ENUMS...).
├── App.tsx           # Thành phần gốc, quản lý Routing.
└── main.tsx          # Điểm khởi đầu của ứng dụng.
```

## 2. Quy tắc Phát triển (Best Practices)

### 2.1 Thành phần (Components)
- Ưu tiên tách nhỏ các component để dễ bảo trì.
- Mỗi component nên nằm trong thư mục riêng nếu nó đi kèm với style hoặc test.

### 2.2 Luồng Dữ liệu
- **API Call**: Luôn viết trong `services/` hoặc sử dụng `api/` instance. Không gọi trực tiếp trong `useEffect` của Component.
- **State**: Sử dụng `context/` cho các trạng thái cần chia sẻ giữa nhiều trang. Sử dụng `hooks/` để tách logic xử lý dữ liệu.

### 2.3 Kết nối Backend
- Dữ liệu thời gian thực từ AI Vision (frames, tracks) phải được nhận qua **WebSocket** kết nối trực tiếp tới FastAPI.
- Tránh việc polling dữ liệu liên tục nếu không cần thiết.

## 3. Ghi chú cho AI Assistant
- Khi thêm một tính năng mới, hãy kiểm tra xem nó thuộc về module nào (ví dụ: một biểu đồ mới nên nằm trong `components/dashboard`).
- Luôn cập nhật `types/` khi có sự thay đổi về cấu trúc dữ liệu từ Backend.
- Đảm bảo các imports tuân thủ cấu trúc thư mục mới (ví dụ: `@/components/common/Card` thay vì đường dẫn tương đối quá sâu nếu đã cấu hình alias).

---
**Senior AI Architect**  
*Dự án ITMS - Frontend Modular Architecture.*
