from app.services.retrieval import retrieve_similar_chunks
from app.services.generation import generate_answer


def answer_question(question: str, top_k: int = 3) -> dict:
    chunks = retrieve_similar_chunks(question, top_k=top_k)
    answer = generate_answer(question, chunks)

    return {
        "question": question,
        "answer": answer,
        "sources": [c["source"] for c in chunks],
    }