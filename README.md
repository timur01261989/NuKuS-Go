# UniGo Platform v11.0.0
## Enterprise-Grade Super App — Uber + Yandex darajasidan yuqori

---

## 📊 Statistika
| Metrika | Qiymat |
|---------|--------|
| **Versiya** | 11.0.0 |
| **Microservices** | 34 ta |
| **Apps** | 8 ta |
| **Shared Libs** | 21 ta |
| **DB Migrations** | 14 ta SQL |
| **K8s Manifests** | 17+ YAML |
| **gRPC Proto** | 4 ta schema |
| **GitHub Actions** | 3 workflow |

---

## 🗺️ Servislar xaritasi (3001-3035 + 8000 + 4000)

| Port | Servis | Kategoriya |
|------|--------|-----------|
| 3001 | auth-service | Core |
| 3002 | ride-service | Core |
| 3003 | delivery-service | Core |
| 3004 | payment-service | Core |
| 3005 | location-service | Core |
| 3006 | notification-service | Core |
| 3007 | freight-service | Transport |
| 3008 | intercity-service | Transport |
| 3009 | marketplace-service | Commerce |
| 3010 | ws-gateway (app) | Gateway |
| 3011 | food-service | Commerce |
| 3012 | interdistrict-service | Transport |
| 3013 | analytics-service | Intelligence |
| 3014 | search-service | Intelligence |
| 3015 | matching-service | Intelligence |
| 3016 | reward-service | Engagement |
| 3017 | routing-service | Maps |
| 3018 | corporate-service | B2B |
| 3019 | safety-service | Trust & Safety |
| 3020 | subscription-service | Monetization |
| 3021 | verification-service | Trust & Safety |
| 3022 | promo-service | Marketing |
| 3023 | chat-service | Communication |
| 3024 | wallet-service | Payments |
| 3025 | earnings-service | Driver |
| 3026 | ab-testing-service | Growth |
| 3027 | privacy-service | Compliance |
| 3028 | voice-service | AI/UX |
| 3029 | sdui-service | Platform |
| 3030 | feature-store-service | ML Platform |
| 3031 | support-service | Operations |
| 3032 | fleet-service | Driver Ops |
| 3033 | rating-service | Trust |
| 3034 | report-service | Analytics |
| 3035 | config-service | Platform |
| 4000 | graphql-gateway (app) | Gateway |
| 8000 | ml-service (app) | AI/ML |
| 8080 | api-gateway (app) | Gateway |

---

## 🚀 Boshlash

```bash
# 1. O'rnatish
npm install
cp .env.example .env
# .env ni Supabase va boshqa kalitlar bilan to'ldiring

# 2. Config xizmatini ishga tushiring
npm run dev:config

# 3. To'liq Docker stack
npm run docker:up

# 4. DB sxemasini yarating
npm run migrate:all

# 5. Config-ni boshlang'ich qiymatlar bilan to'ldiring
npm run config:init

# 6. Frontend
npm run dev:client    # http://localhost:5173
npm run dev:admin     # http://localhost:5174
```

---

## 🏗️ Arxitektura

```
Foydalanuvchi (iOS/Android/Web)
    │
    ├─── REST ──────→ api-gateway :8080
    ├─── GraphQL ───→ graphql-gateway :4000
    └─── WebSocket ─→ ws-gateway :3010
                          │
             ┌────────────┴──────────────┐
             │      34 Microservice      │
             │   (har biri izolyatsiya)  │
             └────────────┬──────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
     PostgreSQL       Redis Cluster     Kafka
     (primary DB)    (cache+geo+queue) (events)
         │                                  │
    ClickHouse                      analytics-service
    (analytics)                       (ClickHouse)
         │
    Elasticsearch
    (search-service)
```

---

## 📐 ARCH_RULES.md — Muqaddas qoidalar

1. **PERFORMANCE FIRST** — API < 50ms
2. **H3 INDEXING** — Uber H3 Res-9
3. **PROTOBUF** — gRPC microservices
4. **ASYNC** — Kafka events
5. **REDLOCK** — Zero double-spend
6. **HOT-WARM-COLD** — Data tiering
7. **ZERO-TRUST** — Fingerprint + mTLS
8. **OFFLINE-FIRST** — Outbox pattern
9. **PREDICTIVE** — Pre-warm drivers
10. **BATTERY OPT** — Dynamic GPS

---

## 🔑 Texnologiyalar

| Qatlam | Stack |
|--------|-------|
| Frontend | React 18 + Vite + TypeScript |
| GraphQL | Apollo Server + DataLoader |
| Mobile | React Native + Expo |
| Gateway | Express + http-proxy-middleware |
| Services | Node.js + TypeScript |
| ML | Python FastAPI + NumPy |
| Database | PostgreSQL 16 + Prisma |
| Cache | Redis 7 (L1+L2) |
| Search | Elasticsearch 8 |
| Analytics | ClickHouse 24 |
| Queue | Kafka + BullMQ |
| Container | K8s + Istio + ArgoCD |
| CDN/Edge | Cloudflare Workers |
| Monitoring | Prometheus + Grafana + Jaeger |
| Security | Vault + mTLS + Redlock |

---

## 📈 Benchmark maqsadlari

| Metrika | Maqsad |
|---------|--------|
| API P95 latency | < 100ms |
| API P99 latency | < 200ms |
| WebSocket connections | 1M+ |
| Orders/sec | 50,000 |
| Location updates/sec | 10M |
| Uptime | 99.99% |
| Deploy downtime | 0 sec |
