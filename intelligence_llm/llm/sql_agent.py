# llm/sql_agent.py
import os
from config.settings import settings
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import ChatOllama
from llm.prompts import SQL_PREFIX

def get_llm():
    if settings.LLM_PROVIDER == "openai":
        return ChatOpenAI(
            model=settings.OPENAI_MODEL, 
            api_key=settings.OPENAI_API_KEY,
            temperature=0
        )
    else:
        return ChatOllama(
            model=settings.OLLAMA_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
            temperature=0
        )

def create_traffic_sql_agent():
    # Tối ưu: Chỉ cho phép Agent truy cập vào các bảng core
    db = SQLDatabase.from_uri(
        settings.POSTGRES_URL, 
        include_tables=['cameras', 'frames', 'detections', 'events']
    )
    
    llm = get_llm()
    
    agent_executor = create_sql_agent(
        llm=llm,
        db=db,
        agent_type="openai-tools" if settings.LLM_PROVIDER == "openai" else "zero-shot-react-description",
        prefix=SQL_PREFIX,
        verbose=True,
        handle_parsing_errors=True
    )
    return agent_executor
