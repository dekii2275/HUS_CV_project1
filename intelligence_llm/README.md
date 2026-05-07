# Intelligence LLM 🧠🚦

Intelligence LLM là một hệ thống hỏi đáp và tạo báo cáo tự động dựa trên kiến trúc **RAG (Retrieval-Augmented Generation)**. Hệ thống này kết nối dữ liệu chuỗi thời gian về giao thông (Traffic Data) từ PostgreSQL/TimescaleDB với sức mạnh của các mô hình ngôn ngữ lớn (LLM như Llama 3 / GPT-4o) để cung cấp khả năng truy vấn bằng ngôn ngữ tự nhiên và tự động tổng hợp báo cáo.

---

## 🏗 Kiến trúc Hệ thống (Pipeline)

Hệ thống hoạt động dựa trên luồng xử lý dữ liệu từ Database đến LLM, kết hợp giữa truy xuất tài liệu nhúng (Semantic Search) và truy xuất dữ liệu có cấu trúc (SQL Agent).
```text
PostgreSQL/TimescaleDB
        │
        ▼
  Data Loader & Formatter
        │
        ▼
  Embedding Engine (sentence-transformers)
        │
        ▼
  Vector Store (ChromaDB / pgvector)
        │
        ▼
  RAG Pipeline (LangChain)
        │         │
        ▼         ▼
  SQL Agent   Doc Retriever
        │         │
        └────┬────┘
             ▼
      LLM (Llama 3 / GPT-4o)
             │
             ▼
    Response Formatter
             │
      ┌──────┴──────┐
      ▼             ▼
  Chat API    Auto Report
  (FastAPI)   (Scheduler)
```

---

## 📂 Cấu trúc Thư mục

Dự án được tổ chức theo module để đảm bảo tính mở rộng và dễ bảo trì:
```text
📁 intelligence_llm/                # Module 4 — LLM & RAG (PHẦN BẠN LÀM)
   ├── README.md
   ├── requirements.txt
   ├── Dockerfile
   │
   ├── app/
   │   ├── __init__.py
   │   ├── main.py                     # FastAPI entry point cho LLM service
   │   │
   │   ├── routers/
   │   │   ├── chat.py                 # POST /chat — nhận câu hỏi, trả lời NL
   │   │   └── reports.py              # GET /reports/daily?date=...
   │   │
   │   └── schemas.py                  # ChatRequest, ChatResponse, ReportResponse
   │
   ├── db/
   │   ├── __init__.py
   │   ├── connection.py               # asyncpg kết nối TimescaleDB
   │   ├── models.py                   # Pydantic schema: TrafficEvent, VehicleCount
   │   └── queries.py                  # SQL query templates (time-range, aggregate)
   │
   ├── ingestion/
   │   ├── __init__.py
   │   ├── loader.py                   # DB rows → LangChain Documents
   │   ├── embedder.py                 # multilingual-e5-base embedding
   │   └── vector_store.py             # ChromaDB upsert + incremental update
   │
   ├── rag/
   │   ├── __init__.py
   │   ├── chain.py                    # LangChain LCEL: retriever→prompt→LLM
   │   ├── retriever.py                # Hybrid: vector search + SQL fallback
   │   ├── sql_agent.py                # LangChain SQL Agent (aggregate queries)
   │   ├── query_router.py             # Phân loại câu hỏi → SQL hay Vector
   │   └── prompts.py                  # System prompt VI, few-shot examples
   │
   ├── reporting/
   │   ├── __init__.py
   │   ├── scheduler.py                # APScheduler: chạy 23:55 mỗi ngày
   │   ├── report_generator.py         # LLM tổng hợp daily stats → văn bản
   │   └── templates/
   │       ├── daily_report.txt        # Prompt template báo cáo ngày
   │       └── weekly_report.txt       # Prompt template báo cáo tuần
   │
   ├── data/
   │   └── seed_sample.py              # Tạo dữ liệu giả để test RAG
   │
   └── tests/
       ├── test_sql_agent.py
       ├── test_rag_chain.py
       ├── test_query_router.py
       └── sample_questions.txt        # 20 câu hỏi mẫu để eval


```
