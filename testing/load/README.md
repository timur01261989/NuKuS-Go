# UniGo Load Testing — k6

## O'rnatish
```bash
brew install k6          # macOS
choco install k6         # Windows
apt install k6           # Ubuntu
```

## Ishlatish

### Ride API load test
```bash
k6 run -e API_URL=http://api.unigo.uz/api/v1 testing/load/ride-load-test.js
```

### Auth stress test
```bash
k6 run -e API_URL=http://api.unigo.uz/api/v1 testing/load/auth-load-test.js
```

### WebSocket scale test
```bash
k6 run -e WS_URL=wss://ws.unigo.uz testing/load/websocket-load-test.js
```

### 1M virtual users simulation
```bash
k6 run --vus 1000000 --duration 10m testing/load/ride-load-test.js
```

## Target metrics (Uber-level)
| Metric | Target |
|--------|--------|
| p95 latency | < 200ms |
| p99 latency | < 500ms |
| Error rate | < 0.1% |
| Throughput | 50K req/sec |
| WS connections | 1M concurrent |
