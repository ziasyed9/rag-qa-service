from app.services.db import get_connection
from app.services.embeddings import embed_text


def retrieve_similar_chunks(query: str, top_k: int = 3) -> list[dict]:
    query_vector = embed_text(query)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, source, content, embedding <-> %s::vector AS distance
        FROM chunks
        ORDER BY distance ASC
        LIMIT %s;
        """,
        (query_vector, top_k)
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return [
        {"id": r[0], "source": r[1], "content": r[2], "distance": r[3]}
        for r in rows
    ]