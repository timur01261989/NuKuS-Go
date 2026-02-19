# AI Pipeline integrated

This project now includes:
- Frontend AI pipeline (React Query + job polling)
- Node backend (Express + BullMQ + Redis)
- Python AI server (FastAPI demo)

## Frontend
Set root .env:
VITE_API_BASE_URL=http://localhost:4000

## Backend
cd backend
npm i
cp .env.example .env
npm run dev:api
# new terminal
npm run dev:worker

## Python (optional)
cd python-ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000 --reload

Then set backend/.env:
AI_MODE=python
PY_AI_URL=http://127.0.0.1:8000
