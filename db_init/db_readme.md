# ITMS Database Initialization Guide

Tài liệu này hướng dẫn cách thiết lập và cấu hình cơ sở dữ liệu cho hệ thống ITMS (Intelligent Traffic Management System), sử dụng **PostgreSQL** kết hợp với extension **TimescaleDB**.

## 1. Yêu cầu Tiền đề
- **PostgreSQL 14+**
- **TimescaleDB Extension**: Bắt buộc để xử lý dữ liệu chuỗi thời gian (time-series).
- **PostGIS Extension** (Tùy chọn): Nếu cần xử lý các truy vấn không gian phức tạp hơn (hiện tại đang dùng kiểu `POINT` mặc định của Postgres).

## 2. Thứ tự Khởi tạo (Dependency Order)
Để đảm bảo các ràng buộc khóa ngoại (Foreign Keys), các bảng phải được tạo theo thứ tự sau:
1.  **`cameras`**: Chứa thông tin gốc về các thiết bị.
2.  **`frames`**: Bảng trung tâm lưu trữ vết của từng khung hình.
3.  **`detections`**: Lưu kết quả AI (phụ thuộc vào `frames`).
4.  **`events`**: Lưu sự kiện/vi phạm (phụ thuộc vào `frames`).

## 3. Cấu hình Hypertable (TimescaleDB)
Chúng ta chuyển đổi các bảng có mật độ dữ liệu cao thành **Hypertables** để tối ưu hóa hiệu năng ghi và truy vấn theo thời gian:

```sql
-- Chuyển đổi bảng frames thành hypertable dựa trên cột timestamp
SELECT create_hypertable('frames', 'timestamp');

-- Chuyển đổi bảng detections thành hypertable
-- Lưu ý: detections kế thừa việc phân vùng từ frames thông qua logic thời gian
SELECT create_hypertable('detections', 'detection_id', chunk_time_interval => interval '1 day');
```

## 4. Giải thích Thiết kế (Rationale)

- **`frame_uuid`**: Sử dụng UUID làm khóa chính cho `frames` thay vì ID tăng dần để hỗ trợ hệ thống phân tán, tránh xung đột ID khi thu thập từ nhiều Edge devices.
- **`POINT` Type**: Dùng cho `location` và `bottom_center` để thực hiện các phép toán khoảng cách nhanh chóng (Euclidean distance) trong SQL.
- **`INT[]` for BBox**: Lưu `[x1, y1, x2, y2]` dưới dạng mảng số nguyên để tiết kiệm không gian và dễ dàng truy xuất tọa độ khung hình.
- **Indexing Strategy**:
    - Index trên `timestamp` (tự động có trong hypertable) giúp truy vấn dashboard thời gian thực cực nhanh.
    - Index trên `track_id` trong bảng `detections` để truy xuất toàn bộ hành trình của một phương tiện.

## 5. Script Khởi tạo
Mọi câu lệnh DDL chi tiết được lưu tại file [init.sql](file:///home/dekii2275/HUS_CV_project1/db_init/init.sql). 

**Lưu ý cho AI Assistant:**
Khi thực hiện các truy vấn aggregation (như đếm xe theo giờ), hãy luôn ưu tiên sử dụng hàm `time_bucket` của TimescaleDB để tối ưu hiệu năng:
```sql
SELECT time_bucket('1 hour', timestamp) AS bucket, COUNT(*) 
FROM frames 
GROUP BY bucket ORDER BY bucket DESC;
```
