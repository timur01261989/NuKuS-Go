Dispatch scaling fixes integrated

1. Driver location cache moved to Redis/memory pattern
2. Redis GEO search service added
3. Memory dispatch matching added
4. Wave dispatch now sends 3 -> 3 -> 5 batches
5. Realtime dispatch is targeted, not broadcast
6. API and WebSocket responsibilities documented separately
7. DB snapshots remain additive only

Recommended production topology:
- API cluster
- Realtime WebSocket cluster
- Redis GEO + queue cluster
- Worker cluster
