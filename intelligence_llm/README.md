# 🧠 intelligence_llm — LLM & RAG Intelligence Layer

> **Module 4** của hệ thống **ITMS (Intelligent Traffic Monitoring System)**  
> Biến dữ liệu giao thông thô thành thông tin tư vấn thông qua Chatbot AI và báo cáo tự động.

---

## 📌 Mục tiêu

Module này chịu trách nhiệm:

- **Natural Language Query** — Người quản lý đặt câu hỏi bằng tiếng Việt tự nhiên, hệ thống tự truy vấn DB và trả lời chính xác
- **RAG Pipeline** — Kết hợp Vector Search và SQL Agent để xử lý mọi loại câu hỏi (sự kiện cụ thể & thống kê tổng hợp)
- **Automated Reporting** — LLM tự động tổng hợp và viết báo cáo tình trạng giao thông cuối ngày
- **Chat API** — Cung cấp REST API cho Dashboard frontend tương tác

---

## 🔄 Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    USER / DASHBOARD                         │
│              "Sáng nay lúc mấy giờ bắt đầu tắc?"           │
└──────────────────────────┬──────────────────────────────────┘
                           │  POST /chat
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     QUERY ROUTER                            │
│         Phân loại: Sự kiện cụ thể hay Thống kê?            │
└──────────────┬───────────────────────────┬──────────────────┘
               │                           │
    Sự kiện cụ thể                   Thống kê / So sánh
               │                           │
               ▼                           ▼
┌──────────────────────┐     ┌─────────────────────────────┐
│   VECTOR RETRIEVER   │     │        SQL AGENT            │
│  ChromaDB semantic   │     │  Tự sinh SQL query → DB     │
│  search trên events  │     │  aggregate, time-range      │
└──────────┬───────────┘     └──────────────┬──────────────┘
           │                                │
           └──────────────┬─────────────────┘
                          │  Context + Data
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  LangChain LCEL CHAIN                       │
│                                                             │
│   System Prompt (VI) + Few-shot + Retrieved Context         │
│                          │                                  │
│                          ▼                                  │
│            LLM (Llama 3.1 8B / GPT-4o)                     │
│                          │                                  │
│                          ▼                                  │
│              Output Parser + Guardrails                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESPONSE TO USER                          │
│    { answer: "...", sources: [...], confidence: 0.92 }      │
└─────────────────────────────────────────────────────────────┘


── NHÁNH SONG SONG: AUTO REPORTING ─────────────────────────

┌──────────────┐     ┌──────────────────┐     ┌────────────┐
│  Scheduler   │────▶│ Report Generator │────▶│  DB / File │
│  23:55 daily │     │  LLM viết báo cáo│     │  lưu trữ   │
└──────────────┘     └──────────────────┘     └────────────┘

── INGESTION PIPELINE (chạy định kỳ) ───────────────────────

┌──────────────────┐     ┌───────────┐     ┌──────────────┐
│  TimescaleDB     │────▶│  Loader   │────▶│   Embedder   │
│  (traffic data)  │     │ DB → Docs │     │ e5-multilang │
└──────────────────┘     └───────────┘     └──────┬───────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │    ChromaDB      │
                                          │  Vector Store    │
                                          └──────────────────┘
```

---

## 🗂️ Cấu trúc thư mục

```
intelligence_llm/
│
├── README.md                           # File này
├── requirements.txt                    # Python dependencies
├── Dockerfile                          # Container cho LLM service
├── .env.example                        # Biến môi trường mẫu
│
├── app/                                # 🌐 FastAPI Application
│   ├── __init__.py
│   ├── main.py                         # Entry point, khởi động server port 8002
│   ├── schemas.py                      # Pydantic: ChatRequest, ChatResponse, ReportResponse
│   └── routers/
│       ├── chat.py                     # POST /chat
│       └── reports.py                  # GET /reports/daily?date=YYYY-MM-DD
│
├── db/                                 # 🗄️ Database Layer
│   ├── __init__.py
│   ├── connection.py                   # asyncpg connection pool
│   ├── models.py                       # Pydantic schema: TrafficEvent, VehicleCount, Violation
│   └── queries.py                      # SQL templates (time-range, aggregate, join)
│
├── ingestion/                          # 📥 Data Ingestion & Embedding
│   ├── __init__.py
│   ├── loader.py                       # DB rows → LangChain Document objects
│   ├── embedder.py                     # Embedding với intfloat/multilingual-e5-base
│   └── vector_store.py                 # ChromaDB upsert, incremental update theo timestamp
│
├── rag/                                # 🤖 RAG Core Engine
│   ├── __init__.py
│   ├── query_router.py                 # Phân loại câu hỏi → SQL Agent hoặc Vector Search
│   ├── retriever.py                    # Hybrid retriever (semantic + SQL fallback)
│   ├── sql_agent.py                    # LangChain SQL Agent cho aggregate queries
│   ├── chain.py                        # LangChain LCEL chain chính
│   └── prompts.py                      # System prompt tiếng Việt, few-shot examples
│
├── reporting/                          # 📊 Automated Reporting
│   ├── __init__.py
│   ├── scheduler.py                    # APScheduler: trigger 23:55 hàng ngày
│   ├── report_generator.py             # Tổng hợp data + LLM viết báo cáo văn bản
│   └── templates/
│       ├── daily_report.txt            # Prompt template báo cáo ngày
│       └── weekly_report.txt           # Prompt template báo cáo tuần
│
├── data/
│   └── seed_sample.py                  # Tạo 10k rows dữ liệu giả để test RAG
│
└── tests/
    ├── test_sql_agent.py
    ├── test_rag_chain.py
    ├── test_query_router.py
    ├── test_api.py
    └── sample_questions.txt            # 20 câu hỏi mẫu để đánh giá độ chính xác
```

---

## ⚙️ Tech Stack

| Thành phần | Công nghệ | Lý do chọn |
|---|---|---|
| **LLM** | Llama 3.1 8B (Ollama) / GPT-4o | Llama: miễn phí, chạy local; GPT-4o: fallback chất lượng cao |
| **RAG Framework** | LangChain (LCEL) | Linh hoạt, hỗ trợ SQL Agent + Vector retriever |
| **Embedding** | `intfloat/multilingual-e5-base` | Hỗ trợ tiếng Việt tốt, miễn phí, chạy local |
| **Vector Store** | ChromaDB | Đơn giản, persistent local, không cần infra phức tạp |
| **Database** | PostgreSQL + TimescaleDB | Tối ưu time-series, query time-range nhanh hơn 10–100x |
| **API** | FastAPI + uvicorn | Async, auto Swagger docs tại `/docs` |
| **Scheduler** | APScheduler | Cron job báo cáo tự động |

---

## 🚀 Cài đặt & Chạy

### 1. Cài đặt dependencies

```bash
cd intelligence_llm
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
# Chỉnh sửa .env với thông tin thực tế
```

```env
# .env.example
POSTGRES_URL=postgresql://user:password@localhost:5432/itms_db
CHROMA_PERSIST_DIR=./chroma_data

# Chọn 1 trong 2 LLM provider:
LLM_PROVIDER=ollama                    # "ollama" hoặc "openai"
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

OPENAI_API_KEY=sk-...                  # Chỉ cần nếu dùng GPT-4o
OPENAI_MODEL=gpt-4o
```

### 3. Khởi tạo Vector Store (chạy 1 lần đầu)

```bash
python -m ingestion.vector_store --init
```

### 4. Seed dữ liệu test (nếu chưa có data từ Module 2/3)

```bash
python data/seed_sample.py
```

### 5. Chạy API server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload
```

Swagger UI: [http://localhost:8002/docs](http://localhost:8002/docs)

### 6. Chạy bằng Docker (khuyến nghị)

```bash
# Từ root repo
docker compose up llm chromadb postgres
```

---

## 📡 API Endpoints

### `POST /chat`

Nhận câu hỏi tiếng Việt, trả về câu trả lời từ LLM.

**Request body:**
```json
{
  "question": "Sáng nay lúc mấy giờ thì ngã tư Đinh Tiên Hoàng bắt đầu tắc?",
  "camera_id": "cam_001",
  "date_range": {
    "from": "2026-05-07T06:00:00",
    "to": "2026-05-07T12:00:00"
  }
}
```

**Response:**
```json
{
  "answer": "Dựa trên dữ liệu ghi nhận, ngã tư Đinh Tiên Hoàng bắt đầu có dấu hiệu ùn tắc từ 7:15 sáng, đạt mức độ nghiêm trọng nhất lúc 7:45 với mật độ 94 xe/phút.",
  "sources": ["traffic_events#2026-05-07T07:15", "vehicle_counts#cam_001"],
  "query_type": "vector_search",
  "confidence": 0.91
}
```

---

### `GET /reports/daily`

Lấy báo cáo tổng hợp cuối ngày do LLM tự viết.

**Query params:** `?date=2026-05-07`

**Response:**
```json
{
  "date": "2026-05-07",
  "report": "BÁO CÁO TÌNH TRẠNG GIAO THÔNG NGÀY 07/05/2026\n\nTổng quan: Lưu lượng giao thông trong ngày đạt 48.200 lượt phương tiện...",
  "summary": {
    "total_vehicles": 48200,
    "peak_hour": "07:30 - 08:30",
    "violations_count": 23,
    "incidents_count": 2
  }
}
```

---

### `GET /health`

Kiểm tra trạng thái service và các kết nối phụ thuộc.

```json
{
  "status": "ok",
  "db": "connected",
  "chromadb": "connected",
  "llm": "ollama:llama3.1:8b"
}
```

---

## 🧪 Chạy Tests

```bash
# Chạy toàn bộ test suite
pytest tests/ -v

# Chạy từng module riêng lẻ
pytest tests/test_sql_agent.py -v
pytest tests/test_rag_chain.py -v
pytest tests/test_query_router.py -v

# Đánh giá chất lượng RAG với 20 câu hỏi mẫu
python tests/eval_rag.py --questions tests/sample_questions.txt
```

---

## 📋 Task Breakdown

| Task ID | Mô tả | Files | Người làm | Deadline |
|---|---|---|---|---|
| **L01** | DB connection & schema TimescaleDB | `db/` | Thịnh, Thành | 10/05 |
| **L02** | Data loader + seed data giả | `ingestion/loader.py`, `data/` | Thành | 14/05 |
| **L03** | Embedding engine + Vector Store | `ingestion/embedder.py`, `vector_store.py` | Tô Quang Thịnh | 17/05 |
| **L04** | SQL Agent + RAG Chain LCEL | `rag/sql_agent.py`, `rag/chain.py`, `rag/retriever.py` | Thịnh, Thành | 24/05 |
| **L05** | System Prompt VI + Query Router | `rag/prompts.py`, `rag/query_router.py` | Thịnh, Thành | 22/05 |
| **L06** | Auto Reporting scheduler | `reporting/` | Thịnh, Thành | 25/05 |
| **L07** | Chat API FastAPI | `app/routers/` | Thịnh, Thành | 30/05 |
| **L08** | Test E2E + Docker + Tối ưu latency | `tests/`, `Dockerfile` | Thịnh, Thành | 07/06 |

---

## 🔗 Kết nối với các Module khác

```
backend_api ──(ghi traffic data)──▶ TimescaleDB
                                         │
                                         │ (đọc)
                                         ▼
                                  intelligence_llm
                                  (port 8002)
                                         │
                          ┌──────────────┴──────────────┐
                          ▼                             ▼
                    POST /chat                  GET /reports
                          │                             │
                          └──────────┬──────────────────┘
                                     ▼
                               frontend_ui
                            (ChatBot + Dashboard)
```

- **Nhận data từ:** `backend_api` ghi vào TimescaleDB — module này chỉ **đọc DB**, không gọi trực tiếp `backend_api`
- **Phục vụ:** `frontend_ui` qua REST API tại port `8002`
- **Độc lập hoàn toàn** với `vision_engine` và `realtime_ytb`

---

## 👥 Người phụ trách

| Tên | Vai trò |
|---|---|
| **Tô Quang Thịnh** | RAG Chain, SQL Agent, Query Router, Embedding, Chat API, Testing |
| **Bùi Tiến Thành** | DB Layer, Data Ingestion & Loader, Auto Reporting, Chat API, Testing |
