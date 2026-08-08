# RAG Q&A Service

A Retrieval-Augmented Generation service that answers questions grounded in real documents, with a full API backend and a web frontend. Built to demonstrate practical LLM application engineering: vector search, retrieval logic, containerization, and cloud deployment, not just a wrapper around a chat API.

![Screenshot of the app answering a question](./screenshots/demo.png)

> This project currently runs locally rather than on a permanent public URL, by design. See "Why it's not permanently live" below.

## What it does

A question comes in through the web UI, gets embedded into a vector, and is compared against a PostgreSQL database (using the pgvector extension) to find the most semantically similar chunks across a set of source documents. Those chunks are passed to an LLM, which generates an answer grounded specifically in that retrieved content. The response includes which source document the answer came from, so it's traceable rather than a black box. Currently loaded with four sample job postings (software engineer, frontend engineer, data engineer, DevOps engineer) to demonstrate retrieval correctly distinguishing between different source documents.

## Architecture

```
Document (.txt)
      │
      ▼
  Chunked into overlapping segments
      │
      ▼
  Embedded (sentence-transformers) ──► stored in PostgreSQL / pgvector
      │
User question (via Next.js frontend)
      │
      ▼
  Embedded the same way
      │
      ▼
  Vector similarity search ──► top-k relevant chunks
      │
      ▼
  Groq LLM (Llama 3.1) generates answer using only retrieved context
      │
      ▼
  FastAPI returns { answer, sources } ──► rendered in the UI
```

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| API | Python 3.11, FastAPI, Pydantic |
| Retrieval | sentence-transformers, PostgreSQL + pgvector (HNSW indexed) |
| Generation | Groq API (Llama 3.1 8B) |
| Infrastructure | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | AWS ECS Fargate, ECR, IAM, VPC |

## Example

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What Kubernetes experience is required?"}'
```

```json
{
  "question": "What Kubernetes experience is required?",
  "answer": "For the DevOps Engineer role, experience with Kubernetes in production environments is nice to have. For the Software Engineer role, Kubernetes experience is preferred but not required.",
  "sources": ["devops_engineer.txt", "software_engineer.txt"]
}
```

## Engineering highlights

**Retrieval is explicit, not a black box.** Similarity search runs directly against pgvector using SQL, `ORDER BY embedding <-> query_vector`, so the ranking logic is fully inspectable rather than hidden behind a library abstraction.

**Multi-document retrieval, verified.** With four distinct job postings loaded, questions correctly retrieve and cite different source documents depending on content, confirming the retrieval step is actually discriminating on meaning rather than just returning whatever's in the database.

**Indexed for scale, not just correctness.** Retrieval initially ran as a brute-force scan comparing the query vector against every row in the table, fine at the current document count, but a real bottleneck as the dataset grows. Added an HNSW index (`CREATE INDEX ... USING hnsw`) on the embedding column so PostgreSQL can find nearest neighbors without scanning the full table, the same kind of approximate nearest-neighbor structure production vector search systems rely on.

**Real production issues surfaced and fixed during the build.** A NumPy 2.x/torch version conflict broke embedding generation. An httpx version mismatch broke the Groq client. The ECS task was killed by an out-of-memory error from underprovisioned memory, diagnosed and fixed by resizing from 1GB to 3GB. A missing IAM task role silently blocked remote container access until identified.

**Secrets are handled deliberately.** Credentials are read from environment variables and never committed. The ECS task definition used for deployment is checked into the repo as a sanitized template with placeholders in place of real values.

**Backend deployed and proven on AWS.** Runs on ECS Fargate with its own IAM roles, VPC networking, and a CI pipeline. The frontend currently runs locally against it; see below for why.

## Running it locally

Requires Docker, Docker Compose, and Node.js.

**Backend:**

1. Create a `.env` file in the project root:
   ```
   DATABASE_URL=postgresql://raguser:your_db_password_here@localhost:5432/ragdb
   POSTGRES_PASSWORD=your_db_password_here
   GROQ_API_KEY=your_groq_key_here
   ```

2. Add `.txt` documents to a `data/` folder.

3. Start the backend:
   ```bash
   docker compose up --build
   ```

4. Load your documents (first time only, safe to re-run since already-ingested files are automatically skipped):
   ```bash
   docker exec -it rag_app python -m app.services.init_db
   docker exec -it rag_app python -m app.services.ingest
   docker exec -it rag_app python -m app.services.embed_chunks
   ```

5. Confirm it's running at `http://localhost:8000/docs`.

**Frontend:**

1. In a separate terminal:
   ```bash
   cd frontend
   ```

2. Create `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

4. Open `http://localhost:3000` and ask a question.

## Why it's not permanently live

The backend has been deployed and tested on AWS ECS Fargate (see below), but is not kept running as a permanent public endpoint. The API has no authentication or rate limiting, and an unauthenticated public LLM endpoint is a genuine risk for unexpected usage and API costs, not a place to cut corners for a portfolio project. For live demonstrations, the stack is spun up on demand, either shown locally or exposed briefly through a temporary HTTPS tunnel, rather than left publicly reachable indefinitely.

## AWS deployment notes

The backend has been deployed to ECS Fargate as two containers (app and database) within a single task, communicating over `localhost` via `awsvpc` networking. Images build and push to Amazon ECR through a manual pipeline; GitHub Actions currently runs build and import checks on every push.

Known limitations of the current AWS setup: the task's public IP changes on every redeployment since there's no load balancer in front of it, and document ingestion into the deployed environment is currently manual rather than automated.

## Limitations

- No authentication or rate limiting on the API, a deliberate reason it isn't left publicly live
- Secrets are passed as plain environment variables in the ECS task definition rather than AWS Secrets Manager
- Document ingestion into the deployed AWS environment is manual; a production version would pull from S3 or a similar persistent store
- No load balancer in the AWS setup yet, so the deployed public endpoint isn't stable across redeployments

## License

MIT