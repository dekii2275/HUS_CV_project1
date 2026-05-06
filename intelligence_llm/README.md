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
intelligence_llm/
│
├── README.md
├── .env.example
├── docker-compose.yml
├── requirements.txt
│
├── data/
│   ├── schema.sql                  # DDL cho PostgreSQL/TimescaleDB
│   └── seed_sample.py              # Script tạo dữ liệu giả để test
│
├── src/
│   ├── __init__.py
│   │
│   ├── db/
│   │   ├── connection.py           # Pool kết nối DB (asyncpg)
│   │   ├── queries.py              # Các SQL query template
│   │   └── models.py               # Pydantic schema cho traffic data
│   │
│   ├── ingestion/
│   │   ├── loader.py               # Load data từ DB → Document objects
│   │   ├── embedder.py             # Tạo embedding (sentence-transformers)
│   │   └── vector_store.py         # Upsert vào ChromaDB / pgvector
│   │
│   ├── rag/
│   │   ├── retriever.py            # Hybrid retriever (semantic + SQL)
│   │   ├── sql_agent.py            # LangChain SQL Agent (tự viết query)
│   │   ├── chain.py                # RAG chain chính (LangChain LCEL)
│   │   └── prompts.py              # System prompt, few-shot examples
│   │
│   ├── reporting/
│   │   ├── scheduler.py            # APScheduler: báo cáo cuối ngày
│   │   ├── report_generator.py     # LLM viết báo cáo từ daily summary
│   │   └── templates/
│   │       └── daily_report.txt    # Prompt template báo cáo
│   │
│   └── api/
│       ├── main.py                 # FastAPI app
│       ├── routers/
│       │   ├── chat.py             # POST /chat — nhận câu hỏi, trả lời
│       │   └── reports.py          # GET /reports/daily
│       └── schemas.py              # Request/Response Pydantic models
│
├── tests/
│   ├── test_sql_agent.py
│   ├── test_rag_chain.py
│   └── test_api.py
│
└── notebooks/
    ├── 01_explore_data.ipynb
    ├── 02_embedding_eval.ipynb
    └── 03_prompt_engineering.ipynb

```
