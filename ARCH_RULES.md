# UniGo High-Load Engineering Manifesto
## Yandex va Uber-dan o'zib ketish qoidalari

> "10 million foydalanuvchi oqimida har bir millisekund — bu pul va mijozning sodiqligi."

---

## 1. PERFORMANCE FIRST
- Har bir API so'rovi **< 50ms** bo'lishi shart (internal latency)
- P99 latency **< 200ms**, P95 **< 100ms**
- Xotiradagi har bir byte hisoblanadi — Object Pooling majburiy
- `.map()` va `.filter()` Hot Path ichida taqiqlanadi — `for` loop ishlatiladi
- N+1 so'rovlar **sifir toleranslik** — barcha JOIN-lar bitta so'rovda

## 2. H3 INDEXING — Hexagonal Spatial Grid
- Barcha geo-qidiruvlar **Uber H3 Resolution 9** darajasida bajariladi
- Haydovchi qidirish: `h3.gridDisk(userCell, k)` — doira emas, hexagon
- Surge zones: H3 cell_id + Redis hash
- `GEORADIUS` faqat fallback sifatida

## 3. PROTOBUF ONLY — Microservices Communication
- Barcha mikroxizmatlararo aloqa faqat **gRPC + Protocol Buffers** orqali
- JSON faqat tashqi API (mobile client) uchun
- FlatBuffers: Real-time location stream uchun (zero-parse)
- Kompressiya: **Brotli** (REST uchun), **gzip** (gRPC uchun)

## 4. ASYNC EVERYTHING — Event-Driven Core
- Foydalanuvchiga javob berish uchun zarur bo'lmagan barcha ishlar Kafka-ga:
  - Log → Kafka → ELK
  - Analytics → Kafka → ClickHouse
  - Notifications → Kafka → notification-service
  - Earnings → Kafka → earnings-service
- Sync faqat: Auth check, Order create, Payment

## 5. DATA INTEGRITY — Zero Double-Spend
- Distributed Lock: **Redis Redlock** — buyurtma band qilishda majburiy
- Optimistic Locking: `version` column barcha kritik jadvallarda
- Idempotency: Har bir POST so'rovida `Idempotency-Key` header tekshiriladi
- Saga Pattern: Har bir distributed transaction uchun

## 6. HOT-WARM-COLD DATA TIERING
```
HOT  (Redis Cluster)      — oxirgi 24 soat: aktiv buyurtmalar, haydovchi loc
WARM (PostgreSQL SSD)     — oxirgi 30 kun: tarix, to'lovlar
COLD (ClickHouse / S3)    — arxiv: 30 kundan eski
```

## 7. ZERO-TRUST SECURITY
- Har bir so'rov: JWT + Device Fingerprint (TLS fingerprinting)
- Internal services: mTLS (Istio)
- Secrets: Vault (rotation har 24 soat)
- WAF: Cloudflare (geo-block, SQL injection, DDoS)

## 8. OFFLINE-FIRST (Client Outbox)
- Buyurtma yuborishda avval `IndexedDB/SQLite`-ga, keyin serverga
- Retry: exponential backoff (1s, 2s, 4s, 8s, max 5 marta)
- Conflict resolution: server wins

## 9. PREDICTIVE COMPUTING
- Ilova ochilganda (pre-dispatch): ML `demand predictor` ishga tushadi
- Foydalanuvchining odatdagi marshrutlari keshlangan
- Driver pre-warming: buyurtmadan 2 daqiqa oldin

## 10. BATTERY OPTIMIZATION (Driver App)
- GPS dinamik chastota:
  - Stationary (tezlik = 0): har 30 soniyada
  - Slow (< 40 km/h): har 20 metrda
  - Fast (> 70 km/h): har 100 metrda
- Location batching: 10 ta nuqta yig'ilgach yuborish
- Akselerometr: harakatni aniqlash, GPS ni uyg'otish

## 11. RELIABILITY — Self-Healing
- Circuit Breaker: har bir xizmat uchun (Hystrix pattern)
- Chaos Engineering: har hafta production-da tasodifiy xizmat o'chiriladi
- Health checks: har 10 soniyada
- Auto-restart: 3 marta muvaffaqiyatsizlikdan keyin pod yangilanadi

## 12. ZERO-DOWNTIME DEPLOYMENT
- Blue-Green DB migration: Logical Replication + atomic switch
- Canary deploys: 5% → 25% → 100% trafik
- Feature flags: yangi kod har doim flag bilan chiqariladi
- Rollback < 30 soniya

---

*"Yandex-dan o'zib ketish uchun sizda Obsessive Performance Culture bo'lishi kerak."*
