# llm/query_router.py
from typing import Literal
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from llm.sql_agent import get_llm
from llm.prompts import ROUTER_PROMPT

class QueryRouter:
    def __init__(self):
        self.llm = get_llm()
        self.prompt = ChatPromptTemplate.from_template(ROUTER_PROMPT)
        self.router_chain = self.prompt | self.llm | StrOutputParser()

    async def route_query(self, question: str) -> Literal["sql", "vector", "hybrid"]:
        """Phân loại câu hỏi của người dùng"""
        print(f"🤖 Router đang phân tích câu hỏi: {question}")
        
        # Gọi LLM để lấy phân loại (Async)
        response = await self.router_chain.ainvoke({"question": question})
        response = response.lower().strip()
        
        # Clean kết quả để đảm bảo chỉ trả về 1 trong 3 loại
        if "hybrid" in response:
            return "hybrid"
        if "sql" in response:
            return "sql"
        if "vector" in response or "search" in response:
            return "vector"
            
        # Default nếu LLM không trả lời đúng format
        return "hybrid"

# Test nhanh router
if __name__ == "__main__":
    router = QueryRouter()
    test_q = "Tại Nguyễn Trãi có bao nhiêu vụ tai nạn hôm nay?"
    print(f"Kết quả phân loại: {router.route_query(test_q)}")
