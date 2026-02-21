# Python AI Server (FastAPI) - Minimal

This service implements:
- POST /pipeline  (JSON: { imagePaths: string[] })

It reads image files from disk (paths provided by Node backend),
and returns demo outputs in the SAME shape expected by the Node worker:
{ studio, damage, recognition }

## Run
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # optional
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
