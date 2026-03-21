# UniGo Platform — v3.0 Optimal Monorepo
## 10M+ Users · 15 Microservices · Full-Stack

---

## 📁 Tuzilma (Optimal)

```
unigo-platform/
│
├── apps/                                 # Ilovalar
│   ├── api-gateway/          :8080       # Markaziy Traffic Controller
│   │   └── src/
│   │       ├── controllers/             # 14 proxy controller
│   │       ├── middlewares/             # auth, rateLimit, circuit, geo, tracing
│   │       ├── handlers/vercel/         # Original Vercel serverless handlers
│   │       ├── routes/                  # v1, v2
│   │       └── utils/                   # serviceRegistry, loadBalancer, healthCheck
│   │
│   ├── client-app/           :5173       # React + Vite (foydalanuvchi)
│   │   ├── src/                         # 1841 React fayl
│   │   ├── server/                      # Vercel serverless API (production)
│   │   │   └── api/                     # 47 API handler
│   │   ├── supabase/                    # Edge Functions + migrations
│   │   └── tests/                       # 104 test fayl
│   │
│   ├── admin-panel/          :5174       # React admin dashboard
│   ├── driver-app/                       # React Native + Expo
│   ├── ws-gateway/           :3010       # Socket.IO WebSocket
│   └── ml-service/           :8000       # Python FastAPI ML
│
├── services/                             # Backend Microservices
│   ├── auth-service/         :3001       # JWT + OTP + strategies
│   ├── ride-service/         :3002       # Orders + pricing + saga
│   │   └── src/
│   │       ├── orders/                  # State machine, cache, dispatch
│   │       └── pricing/                 # Surge, dynamic, predictive
│   ├── delivery-service/     :3003       # Yetkazib berish
│   ├── payment-service/      :3004       # Payme + Click + UzCard + wallet
│   │   └── src/
│   │       ├── providers/               # payme, click, humo, uzcard
│   │       ├── wallet/                  # walletService, splitPayment
│   │       ├── fraud/                   # fraudDetector
│   │       └── ledger/                  # settlementEngine, ledger
│   ├── location-service/     :3005       # Redis Geo + heatmap
│   │   └── src/
│   │       ├── tracking/                # driverTracker, heatmap
│   │       ├── geofence/                # zoneManager (surge zones)
│   │       ├── location/                # cityService, geoRedis
│   │       └── drivers/                 # heartbeat, locationStream
│   ├── notification-service/ :3006       # FCM + SMS + Email + InApp
│   │   └── src/
│   │       └── safety/                  # SOS service
│   ├── freight-service/      :3007       # Yuk tashish
│   ├── intercity-service/    :3008       # Shaharlararo
│   ├── marketplace-service/  :3009       # Avto savdo
│   ├── food-service/         :3011       # Ovqat yetkazish
│   ├── interdistrict-service/:3012       # Tumanlararo
│   ├── analytics-service/    :3013       # ClickHouse + real-time
│   │   └── src/
│   │       ├── ai/                      # demand forecast, supply, surge
│   │       └── monitoring/              # telemetry, observability
│   ├── search-service/       :3014       # Elasticsearch
│   ├── matching-service/     :3015       # Driver-Rider matching + ML
│   │   └── src/
│   │       ├── algorithms/              # nearestDriver, batch, fairness
│   │       ├── ml/                      # etaModel, demandPredictor
│   │       ├── dispatch/                # smartDispatch, wave, realtime
│   │       ├── intelligence/            # ratings, bonus, distribution
│   │       └── queue/                   # Redis queue, autoscaling
│   └── reward-service/       :3016       # Bonus + referral + gamification
│
├── libs/                                 # Umumiy kutubxonalar
│   ├── core-types/                       # TypeScript interfaces
│   ├── api-client/                       # Axios + auto-refresh
│   ├── ui-kit/                           # Button, Input, Card, OtpInput
│   ├── utils/                            # haversine, format, debounce
│   ├── zod-schemas/                      # Runtime validation
│   ├── event-bus/                        # Kafka publisher + topics
│   ├── cache-lib/                        # L1(memory) + L2(Redis)
│   ├── geo-lib/                          # H3, haversine, polyline
│   └── feature-flags-lib/                # Feature toggle
│
├── supabase/                             # Supabase Edge Functions
│   ├── functions/                        # OTP, signup, verification
│   └── migrations/                       # Supabase DB migrations
│
├── infrastructure/
│   ├── docker-compose.yml                # 22 servis
│   ├── db/
│   │   ├── postgres/
│   │   │   ├── init.sql                  # Base schema
│   │   │   └── migrations/
│   │   │       ├── 001-006_*.sql         # Monorepo migrations
│   │   │       ├── supabase/             # Original SQL files
│   │   │       └── original/             # Archived originals
│   │   ├── redis/                        # Config
│   │   ├── kafka/                        # Config + topics.sh
│   │   └── clickhouse/                   # Config
│   ├── k8s/
│   │   ├── base/                         # Deployment, HPA, PDB, ConfigMap
│   │   ├── overlays/ (dev + prod)
│   │   └── service-mesh/                 # Istio VirtualService, mTLS
│   ├── ci-cd/
│   │   ├── github-actions/               # build, deploy, security
│   │   ├── argocd/                       # GitOps
│   │   └── scripts/                      # db-migrate.sh
│   ├── observability/
│   │   ├── prometheus/
│   │   ├── grafana/
│   │   ├── elk-stack/
│   │   └── jaeger/
│   └── security/
│       ├── vault.config.hcl
│       ├── waf/
│       └── ssl/
│
├── docs/
│   └── architecture/                     # Arxitektura qarorlari
│
├── feature-flags/
│   ├── default-flags.json
│   └── environments.json
│
├── .env.example                          # Barcha env varlar
├── .gitignore
├── turbo.json                            # Turborepo pipeline
└── package.json                          # Workspace root
```

---

## 🚀 Boshlash

```bash
# 1. O'rnatish
npm install
cp .env.example .env

# 2. Faqat frontend
npm run dev:client    # http://localhost:5173
npm run dev:admin     # http://localhost:5174

# 3. To'liq stack
npm run docker:up

# 4. Kafka topiclarini yarating
docker exec kafka bash /topics.sh
```

---

## 🔌 Servislar xaritasi

| Port | Servis | Vazifa |
|------|--------|--------|
| 5173 | client-app | Foydalanuvchi |
| 5174 | admin-panel | Admin |
| 8080 | api-gateway | HTTP routing |
| 3010 | ws-gateway | WebSocket |
| 8000 | ml-service | ETA/Surge/Fraud |
| 3001 | auth-service | Login/OTP |
| 3002 | ride-service | Taksi |
| 3003 | delivery-service | Yetkazish |
| 3004 | payment-service | To'lov |
| 3005 | location-service | GPS |
| 3006 | notification-service | Bildirishnoma |
| 3007 | freight-service | Yuk |
| 3008 | intercity-service | Shaharlararo |
| 3009 | marketplace-service | Avto savdo |
| 3011 | food-service | Ovqat |
| 3012 | interdistrict-service | Tumanlararo |
| 3013 | analytics-service | Tahlil |
| 3014 | search-service | Qidirish |
| 3015 | matching-service | Matching |
| 3016 | reward-service | Bonus/Referral |

---

## 🏗️ Arxitektura

```
Internet → Cloudflare WAF → K8s Ingress → api-gateway:8080
                                               │
           ┌────────────────────────────────────┤
           │          Circuit Breaker           │
           │          Rate Limiter (200/min)    │
           │          JWT Auth                  │
           │          Geo Block                 │
           └────────────────────────────────────┘
           │
    ┌──────┴──────────────────────────────────────────┐
    │                  SERVICES                        │
    │  auth → ride → delivery → payment → location    │
    │  freight → intercity → marketplace → food       │
    │  notification → analytics → search → matching   │
    │  reward → interdistrict                         │
    └──────────────────────────────────────────────────┘
           │
    Kafka (message broker)
    Redis (cache + geo + pub/sub)
    PostgreSQL (primary DB)
    ClickHouse (analytics)
    Elasticsearch (search)
```

---

## 🔑 Muhim deployment qoidalari

**Vercel (client-app):**
- `apps/client-app/server/` → Vercel serverless functions (hozirgi production)
- `apps/client-app/vercel.json` → deploy config

**Kubernetes (microservices):**
```bash
kubectl apply -k infrastructure/k8s/overlays/production
```

**Supabase:**
```bash
# Edge functions deploy
supabase functions deploy send-signup-otp
supabase functions deploy verify-signup-otp
```
