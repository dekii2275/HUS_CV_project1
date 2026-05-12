# Cập nhật trong rag/chain.py
from rag.query_router import QueryRouter

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
        # Sử dụng LLM Router thay vì keyword matching
        route = self.router.route_query(question)
        
        if route == "sql":
            print("🚀 Decision: SQL Agent")
            response = self.sql_agent.invoke({"input": question})
            return response["output"]
            
        elif route == "vector":
            print("🚀 Decision: Vector Search")
            return self.rag_chain.invoke(question)
            
        else: # hybrid
            print("🚀 Decision: Hybrid (Combining SQL & Vector)")
            # Với Hybrid, ta lấy context từ cả 2 nhưng ưu tiên RAG chain 
            # kèm thông tin bổ trợ từ SQL nếu cần (Trong Task này ta chạy RAG chain trước)
            return self.rag_chain.invoke(question)
