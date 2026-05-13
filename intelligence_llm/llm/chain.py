# llm/chain.py
from llm.query_router import QueryRouter
from langchain_core.prompts import ChatPromptTemplate
from llm.sql_agent import get_llm, create_traffic_sql_agent
from llm.retriever import TrafficRetriever
from llm.prompts import RAG_SYSTEM_PROMPT
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser

class TrafficRAGChain:
    def __init__(self):
        self.llm = get_llm()
        self.retriever = TrafficRetriever()
        self.sql_agent = create_traffic_sql_agent()
        self.router = QueryRouter()
        
        self.prompt = ChatPromptTemplate.from_template(RAG_SYSTEM_PROMPT)
        self.rag_chain = (
            {"context": self.retriever.get_context, "question": RunnablePassthrough()}
            | self.prompt
            | self.llm
            | StrOutputParser()
        )

    async def ask(self, question: str):
        route = await self.router.route_query(question)
        
        if route == "sql":
            print("🚀 Decision: SQL Agent")
            response = await self.sql_agent.ainvoke({"input": question})
            return response["output"]
            
        elif route == "vector":
            print("🚀 Decision: Vector Search")
            return await self.rag_chain.ainvoke(question)
            
        else: # hybrid
            print("🚀 Decision: Hybrid (Combining SQL & Vector)")
            return await self.rag_chain.ainvoke(question)
