from app.services.db import get_connection


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id SERIAL PRIMARY KEY,
            source TEXT NOT NULL,
            content TEXT NOT NULL,
            embedding VECTOR(384)
        );
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("Database initialized.")


if __name__ == "__main__":
    init_db()