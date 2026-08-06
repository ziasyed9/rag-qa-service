from fastapi import FastAPI
from app.routers import qa

app = FastAPI(title="RAG Q&A Service")

app.include_router(qa.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}