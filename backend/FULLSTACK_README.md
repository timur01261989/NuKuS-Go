# Fullstack quickstart

## 1) Redis
docker run -p 6379:6379 redis:7

## 2) Backend (Node)
cd backend
npm i
cp .env.example .env
npm run dev:api
# new terminal
npm run dev:worker

## 3) Frontend
Create .env in project root (or copy .env.example) and run your usual dev command.
Ensure:
VITE_API_BASE_URL=http://localhost:4000

## 4) Python AI (optional, privacy mode)
cd python-ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload

Then in backend/.env set:
AI_MODE=python
PY_AI_URL=http://127.0.0.1:8000
