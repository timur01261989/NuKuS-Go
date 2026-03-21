# UniGo ML Service

FastAPI-based ML service for:
- **ETA prediction** — traffic-aware travel time
- **Surge pricing** — supply/demand ratio
- **Fraud detection** — rule-based + ML scoring
- **Demand forecasting** — hourly/zone demand

## Run locally
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Endpoints
- `POST /eta/predict` — ETA & distance
- `POST /surge/calculate` — Surge multiplier
- `POST /fraud/check` — Fraud risk score
- `POST /demand/predict` — Area demand score
- `GET  /health` — Health check
- `GET  /docs` — Swagger UI
