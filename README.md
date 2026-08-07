# RAG Q&A Service

A Retrieval-Augmented Generation service that answers questions grounded in real documents. Built to demonstrate practical LLM application engineering: vector search, retrieval logic, containerization, and a full deployment pipeline to the cloud, not just a wrapper around a chat API.

**Live demo:** `http://<current-task-ip>:8000/docs` (IP changes on redeploy, see Deployment notes below)

## What it does

A question comes in, gets embedded into a vector, and is compared against a PostgreSQL database (using the pgvector extension) to find the most semantically similar chunks of source documents. Those chunks are passed to an LLM, which generates an answer grounded specifically in that retrieved content. The response includes which source document the answer came from, so it's traceable rather than a black box.

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
User question
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
  FastAPI returns { answer, sources }
```

## Tech stack

| Layer | Tools |
|---|---|
| API | Python 3.11, FastAPI, Pydantic |
| Retrieval | sentence-transformers, PostgreSQL + pgvector |
| Generation | Groq API (Llama 3.1 8B) |
| Infrastructure | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | AWS ECS Fargate, ECR, IAM, VPC |

## Example

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What Python experience is required?"}'
```

```json
{
  "question": "What Python experience is required?",
  "answer": "2+ years of professional experience with Python.",
  "sources": ["software_engineer.txt"]
}
```

## Engineering highlights

**Retrieval is explicit, not a black box.** Similarity search runs directly against pgvector using SQL, `ORDER BY embedding <-> query_vector`, so the ranking logic is fully inspectable rather than hidden behind a library abstraction.

**Real production issues surfaced and fixed during the build.** A NumPy 2.x/torch version conflict broke embedding generation. An httpx version mismatch broke the Groq client. The ECS task was killed by an out-of-memory error from underprovisioned memory, diagnosed and fixed by resizing from 1GB to 3GB. A missing IAM task role silently blocked remote container access until identified.

**Secrets are handled deliberately.** Credentials are read from environment variables and never committed. The ECS task definition used for deployment is checked into the repo as a sanitized template with placeholders in place of real values.

**Actually deployed, not just described.** Runs on AWS ECS Fargate with its own IAM roles, VPC networking, and a CI pipeline, not a local-only demo.

## Running it locally

Requires Docker and Docker Compose.

1. Create a `.env` file in the project root:
   ```
   DATABASE_URL=postgresql://raguser:your_db_password_here@localhost:5432/ragdb
   POSTGRES_PASSWORD=your_db_password_here
   GROQ_API_KEY=your_groq_key_here
   ```

2. Add `.txt` documents to a `data/` folder.

3. Start everything:
   ```bash
   docker compose up --build
   ```

4. Load your documents:
   ```bash
   docker exec -it rag_app python -m app.services.init_db
   docker exec -it rag_app python -m app.services.ingest
   docker exec -it rag_app python -m app.services.embed_chunks
   ```

5. Test it at `http://localhost:8000/docs` or with curl as shown above.

## Deployment notes

Deployed to AWS ECS Fargate as two containers (app and database) within a single task, communicating over `localhost` via `awsvpc` networking. Images build and push to Amazon ECR through a manual pipeline for now; GitHub Actions currently runs build and import checks on every push, extending it to auto-deploy on merge to main is a natural next step.

The public IP changes on every redeployment since there's no load balancer in front of the service yet. In a production setup this would sit behind an Application Load Balancer with a stable DNS name.

## Limitations

- Retrieval quality depends on the size of the document set, currently small, and improves with more source documents
- Secrets are passed as plain environment variables in the ECS task definition rather than AWS Secrets Manager
- Document ingestion into the deployed environment is manual; a production version would pull from S3 or a similar persistent store
- No load balancer yet, so the public endpoint isn't stable across redeployments

## License

MIT