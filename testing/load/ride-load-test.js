import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const API = __ENV.API_URL || "http://localhost:8080/api/v1";

const rideDuration = new Trend("ride_request_duration");
const rideErrors   = new Counter("ride_errors");
const successRate  = new Rate("ride_success_rate");

export const options = {
  stages: [
    { duration: "30s", target: 50   },   // Ramp up to 50 users
    { duration: "1m",  target: 200  },   // Ramp up to 200 users
    { duration: "2m",  target: 500  },   // Peak: 500 concurrent
    { duration: "1m",  target: 1000 },   // Stress: 1000 users
    { duration: "30s", target: 0    },   // Ramp down
  ],
  thresholds: {
    http_req_duration:    ["p(95)<500"],   // 95% of requests < 500ms
    http_req_failed:      ["rate<0.01"],   // Error rate < 1%
    ride_success_rate:    ["rate>0.99"],   // 99% success
  },
};

const TOKENS = [
  __ENV.TOKEN_1 || "test-token-1",
  __ENV.TOKEN_2 || "test-token-2",
];

function getToken() {
  return TOKENS[Math.floor(Math.random() * TOKENS.length)];
}

export default function () {
  const headers = {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${getToken()}`,
  };

  // 1. Search for nearby drivers (most common)
  {
    const res = http.get(`${API}/location/nearby?lat=41.2995&lng=69.2401&radius_km=5`, { headers });
    check(res, { "nearby OK": r => r.status === 200 });
    rideDuration.add(res.timings.duration);
    if (res.status !== 200) rideErrors.add(1);
    successRate.add(res.status === 200);
  }
  sleep(0.5);

  // 2. Get ETA prediction
  {
    const res = http.post(`${API}/ml/eta/predict`, JSON.stringify({
      pickup:      { lat: 41.2995, lng: 69.2401 },
      dropoff:     { lat: 41.3101, lng: 69.2701 },
      hour:        new Date().getHours(),
      day_of_week: new Date().getDay(),
    }), { headers });
    check(res, { "ETA OK": r => r.status === 200 });
    if (res.status !== 200) rideErrors.add(1);
  }
  sleep(0.3);

  // 3. Create ride order (10% of requests)
  if (Math.random() < 0.1) {
    const res = http.post(`${API}/ride/order`, JSON.stringify({
      service_type:  "taxi",
      pickup:        { lat: 41.2995 + Math.random() * 0.05, lng: 69.2401 + Math.random() * 0.05 },
      dropoff:       { lat: 41.3101 + Math.random() * 0.05, lng: 69.2701 + Math.random() * 0.05 },
      payment_method:"cash",
    }), { headers });
    check(res, { "Create ride OK": r => r.status === 200 || r.status === 201 });
    rideDuration.add(res.timings.duration);
    if (res.status >= 400) rideErrors.add(1);
  }
  sleep(1);
}
