from app.services.db import get_connection
from app.services.embeddings import embed_text

def embed_all_chunks():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, content FROM chunks WHERE embedding IS NULL;")
    rows = cur.fetchall()

    print(f"Found {len(rows)} chunks without embeddings.")

    for chunk_id, content in rows:
        vector = embed_text(content)
        cur.execute(
            "UPDATE chunks SET embedding = %s WHERE id = %s;",
            (vector, chunk_id)
        )

    conn.commit()
    cur.close()
    conn.close()
    print("Done embedding chunks.")


if __name__ == "__main__":
    embed_all_chunks()