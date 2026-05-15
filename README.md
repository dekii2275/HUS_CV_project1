# 🚀 Hướng Dẫn Quy Trình Làm Việc Team HUS_CV_PROJECT1

Tài liệu này quy định cách thức phối hợp, quản lý source code và môi trường làm việc của cả team để đảm bảo dự án chạy trơn tru trong thời gian ngắn, tránh xung đột code (merge conflict) và rác hệ thống.

---

## 1. 👥 Trách Nhiệm Phân Quyền (Owners)
Mỗi module hoạt động hoàn toàn độc lập với môi trường riêng. Người phụ trách có toàn quyền quyết định cấu trúc bên trong thư mục của mình:
* **`vision_engine/`**: Tuấn em (Thuật toán YOLO, Tracking, xử lý frame).
* **`backend_api/`**: Hằng (Logic đếm xe, tính vận tốc, Fast API, Database).
* **`intelligence_llm/`**: Thịnh, Tuấn em, Thành (LangChain, Text-to-SQL, Prompting).
* **`frontend_ui/` & Hệ thống Docker**: Toàn team phối hợp ghép nối.

---

## 2. 🌿 Quy Trình Quản Lý Nhánh (Git Flow)
Chúng ta sẽ áp dụng mô hình Git Flow rút gọn. **Tuyệt đối KHÔNG commit trực tiếp lên nhánh `main`.**

* **`main`**: Nhánh chứa code ổn định, có thể chạy/deploy được.
* **`dev`**: Nhánh tích hợp chung. Các module sau khi code xong sẽ gộp vào đây để test nội bộ.
* **`feature/...`**: Nhánh của từng người khi làm tính năng mới.

**Quy trình làm việc hàng ngày:**
1. Clone dự án và chuyển sang nhánh `dev`: `git checkout dev`
2. Cập nhật code mới nhất: `git pull origin dev`
3. Tạo nhánh làm việc riêng (Ví dụ Hằng làm API đếm xe): `git checkout -b feature/backend-traffic-count`
4. Code, test nội bộ trong thư mục của mình.
5. Add và Commit code: `git add .` -> `git commit -m "feat(backend): add virtual line counting API"`
6. Push nhánh lên Github: `git push origin feature/backend-traffic-count`
7. Lên Github tạo **Pull Request (PR)** từ nhánh `feature/...` vào nhánh `dev`. Nhờ 1 thành viên khác review và Merge.

---

## 3. 📝 Quy Định Về File Nặng (Model Weights & Video)
Vì đây là dự án Computer Vision, **tuyệt đối cấm push các file sau lên Git** để tránh làm phình repo:
* File trọng số mô hình: `.pt`, `.onnx`, `.engine` (VD: `yolo11.pt`).
* File video test: `.mp4`, `.avi`.
* File dữ liệu: `.csv`, `.db` hoặc thư mục Dataset.

**Cách xử lý:** * Tất cả các định dạng trên đã được cấu hình chặn trong file `.gitignore`.
* Team sẽ sử dụng chung một thư mục **Google Drive** để lưu trữ model weights và video test.
* Khi clone code về, mỗi người tự tải file `best.pt` từ Drive và đặt vào thư mục `vision_engine/weights/` tại máy local.

---

## 4. ⚙️ Môi Trường Và Biến Bảo Mật
Dự án được chia thành nhiều service (Vision, Backend, LLM) nên mỗi thư mục sẽ có file `requirements.txt` riêng. Ai làm module nào thì cài thư viện module đó, không cài chung để tránh xung đột phiên bản.

**Quản lý biến môi trường (.env):**
* Không ai được push file `.env` lên Git (chứa API Keys, Password Database).
* Khi cần thêm một biến môi trường (VD: `OPENAI_API_KEY`, `POSTGRES_USER`), hãy cập nhật tên biến đó vào file `.env.example` (để trống giá trị) và push lên.
* Những người khác khi lấy code về sẽ copy file `.env.example` thành `.env` và tự điền key cá nhân vào để chạy local.

---

## 5. ✍️ Quy Chuẩn Viết Code
1.  **Ngôn ngữ:** Code 100% bằng tiếng Anh (Tên biến, hàm, class). Comments và Docs có thể dùng tiếng Việt cho nhanh.
2.  **Đường dẫn tĩnh (Paths):** Không dùng đường dẫn tuyệt đối kiểu `C:\Users\Name\Desktop\...`. Hãy dùng đường dẫn tương đối (ví dụ: `os.path.join()`, `Pathlib`) để code chạy được trên mọi máy.
3.  **Giao tiếp giữa các module:** Giữa Vision và Backend giao tiếp bằng JSON thông qua API. Schema JSON phải được chốt và ghi rõ trên file doc chung trước khi code để hai bên không bị lệch cấu trúc.
4.  **Clean Code:** Module hóa các hàm tiện ích (như Perspective Transform, vẽ Box) ra thư mục `utils/` thay vì nhồi nhét hết vào file chạy chính.

---
*Chúc cả team chạy sprint thật mượt mà, ít bug và chốt hạ dự án thành công!* 🚀

