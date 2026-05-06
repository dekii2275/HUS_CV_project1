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
