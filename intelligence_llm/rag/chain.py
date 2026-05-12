# rag/chain.py
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from rag.sql_agent import get_llm, create_traffic_sql_agent
from rag.retriever import TrafficRetriever
from rag.prompts import RAG_SYSTEM_PROMPT

class TrafficRAGChain:
    def __init__(self):
        self.llm = get_llm()
        self.retriever = TrafficRetriever()
        self.sql_agent = create_traffic_sql_agent()
        
        # Thiết lập RAG Chain bằng LCEL
        self.prompt = ChatPromptTemplate.from_template(RAG_SYSTEM_PROMPT)
        self.rag_chain = (
            {"context": self.retriever.get_context, "question": RunnablePassthrough()}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )

    def ask(self, question: str):
        # Logic phân loại đơn giản cho Task L04
        stat_keywords = ["bao nhiêu", "tổng", "trung bình", "thống kê", "cao nhất", "xe"]
        is_stat_query = any(kw in question.lower() for kw in stat_keywords)
        
        try:
            if is_stat_query:
                print(f"⚙️ Routing to [SQL AGENT]: {question}")
                response = self.sql_agent.invoke({"input": question})
                return response["output"]
            else:
                print(f"🔍 Routing to [VECTOR SEARCH]: {question}")
                return self.rag_chain.invoke(question)
        except Exception as e:
            return f"Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi: {str(e)}"

# --- Code chạy thử (Test L04) ---
if __name__ == "__main__":
    chain = TrafficRAGChain()
    
    # Test câu hỏi SQL
    print("\n--- TEST SQL ---")
    print(chain.ask("Tổng số lượng xe máy đã đi qua CAM_01 trong hôm nay?"))
    
    # Test câu hỏi Vector
    print("\n--- TEST VECTOR ---")
    print(chain.ask("Có vụ tai nạn nào nghiêm trọng gần đây không?"))
