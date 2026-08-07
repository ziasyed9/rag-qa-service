import os
from app.services.db import get_connection
from app.services.chunking import chunk_text

DATA_DIR = "data"


def get_already_ingested_sources(cur) -> set[str]:
    cur.execute("SELECT DISTINCT source FROM chunks;")
    return {row[0] for row in cur.fetchall()}


def ingest_documents():
    conn = get_connection()
    cur = conn.cursor()

    already_ingested = get_already_ingested_sources(cur)

    for filename in os.listdir(DATA_DIR):
        if not filename.endswith(".txt"):
            continue

        if filename in already_ingested:
            print(f"Skipping {filename}, already ingested.")
            continue

        filepath = os.path.join(DATA_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()

        chunks = chunk_text(text)

        for chunk in chunks:
            cur.execute(
                "INSERT INTO chunks (source, content) VALUES (%s, %s)",
                (filename, chunk)
            )

        print(f"Ingested {len(chunks)} chunks from {filename}")

    conn.commit()
    cur.close()
    conn.close()


if __name__ == "__main__":
    ingest_documents()