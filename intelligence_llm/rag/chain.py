# Cập nhật trong rag/chain.py
# from rag.retriever import TrafficRetriever
from rag.query_router import QueryRouter
# from rag.sql_agent import get_llm, create_traffic_sql_agent
from langchain_core.prompts import ChatPromptTemplate
from rag.sql_agent import get_llm, create_traffic_sql_agent
from rag.retriever import TrafficRetriever
from rag.prompts import RAG_SYSTEM_PROMPT  # Hoặc tên biến prompt hệ thống của nhóm bạn
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
class TrafficRAGChain:
    def __init__(self):
        self.llm = get_llm()
        self.retriever = TrafficRetriever()
        self.sql_agent = create_traffic_sql_agent()
        self.router = QueryRouter() # Thêm router vào đây
        
        self.prompt = ChatPromptTemplate.from_template(RAG_SYSTEM_PROMPT)
        self.rag_chain = (
            {"context": self.retriever.get_context, "question": RunnablePassthrough()}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )

    def ask(self, question: str):
        route = self.router.route_query(question)
        
        if route == "sql":
            print("🚀 Decision: SQL Agent")
            response = self.sql_agent.invoke({"input": question})
            return response["output"]  # Trả về chuỗi text kết quả SQL
            
        elif route == "vector":
            print("🚀 Decision: Vector Search")
            return self.rag_chain.invoke(question)  # Trả về chuỗi text kết quả RAG
            
        else: # hybrid
            print("🚀 Decision: Hybrid (Combining SQL & Vector)")
            return self.rag_chain.invoke(question)
