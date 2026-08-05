from fastapi import FastAPI

app = FastAPI(title="RAG Q&A Service")


@app.get("/health")
def health_check():
    return {"status": "ok"}