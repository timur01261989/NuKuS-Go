# Super Market (Passenger module) - Architecture

This project keeps the old working principle intact and adds an enterprise layer on top:

## What is unchanged
- services/marketApi.js remains the single source of truth for the current behavior.

## What is added
- api/*.service.js as a proxy layer (clean imports, future backend swap).
- React Query caching hooks:
  - hooks/data/useCarsList.js
  - hooks/data/useCarDetails.js
- AI Pipeline:
  - ai.jobs.service.js + useAiPipeline hook
  - AiProcessContext + AiPipelineStatus UI
- SSE job events endpoint:
  - backend: GET /ai/jobs/:jobId/events
  - frontend: subscribeAiJobEvents()

## Why this scales better
- Caching reduces repeated fetches on back navigation.
- SSE reduces polling load for AI progress.
- Service split prevents marketApi.js from becoming a monolith.
