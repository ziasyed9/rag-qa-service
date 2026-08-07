from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import qa

app = FastAPI(title="RAG Q&A Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(qa.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}