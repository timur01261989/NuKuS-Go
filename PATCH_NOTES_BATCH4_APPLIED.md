# PATCH_NOTES_BATCH4_APPLIED

Batch 4 focuses on AI worker, Python service, upload/state hardening and frontend AI integration stability.

## Changed files
- backend/src/store.js
- backend/src/server.js
- backend/src/worker.js
- backend/src/ai/pythonClient.js
- src/modules/client/features/auto-market/api/axiosClient.js
- src/modules/client/features/auto-market/api/ai.jobs.service.js
- src/modules/client/features/auto-market/components/Create/steps/Step3_Photos.jsx
- src/modules/client/features/auto-market/hooks/ai/useAiPipeline.js
- python-ai/app.py

## Main fixes
1. AI job state is now persisted to shared filesystem JSON files so server and worker can see the same state.
2. SSE and GET job status now read from shared persisted state instead of process-local memory only.
3. Python pipeline client now has timeout support and normalized base URL handling.
4. Auto Market photo recognition now calls `/car-recognize` directly and accepts both `VITE_API_BASE_URL` and `VITE_API_BASE`.
5. AI mock mode no longer silently activates in production when backend base URL is missing.
6. Polling is reduced automatically once SSE updates start arriving.
7. Python AI CORS is now env-driven instead of hard-coded `*`.
8. Upload endpoint now enforces file size limits and rejects non-image files.
