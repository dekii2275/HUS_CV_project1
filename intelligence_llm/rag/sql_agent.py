# rag/sql_agent.py
import os
from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import ChatOllama
from rag.prompts import SQL_PREFIX

load_dotenv()

def get_llm():
    provider = os.getenv("LLM_PROVIDER", "ollama")
    if provider == "openai":
        return ChatOpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o"), temperature=0)
    else:
        return ChatOllama(
            model=os.getenv("OLLAMA_MODEL", "llama3.1:8b"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0
        )

def create_traffic_sql_agent():
    db_url = os.getenv("POSTGRES_URL")
    # Tối ưu: Chỉ cho phép Agent truy cập vào các bảng cần thiết
    db = SQLDatabase.from_uri(db_url, include_tables=['vehicle_counts', 'traffic_events', 'violations'])
    
    llm = get_llm()
    
    agent_executor = create_sql_agent(
        llm=llm,
        db=db,
        agent_type="openai-tools" if os.getenv("LLM_PROVIDER") == "openai" else "zero-shot-react-description",
        prefix=SQL_PREFIX,
        verbose=True,
        handle_parsing_errors=True
    )
    return agent_executor
