# Auto Market AI Backend (Express + BullMQ)

## What it does
Implements the exact contract used by the React feature:
- POST /ai/jobs -> { jobId }
- GET /ai/jobs/:jobId -> { status, progress, steps, result, error }

## Run locally
1) Start Redis
   docker run -p 6379:6379 redis:7

2) Install deps
   npm i

3) Configure env
   cp .env.example .env

4) Start API
   npm run dev:api

5) Start worker (new terminal)
   npm run dev:worker

## Connect frontend
Set frontend env:
VITE_API_BASE_URL=/api

## Switch to Python AI
1) Run Python service (see ../python-ai/README.md)
2) In backend .env:
   AI_MODE=python
   PY_AI_URL=http://127.0.0.1:8000

3) Ensure Python AI can read the same upload directory:
   - backend saves uploads to UPLOAD_DIR (default ./uploads relative to backend)
   - python-ai validates paths using UPLOAD_DIR env (set it to backend uploads absolute path if needed)
