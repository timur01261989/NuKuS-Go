import http from "k6/http";
import { check, sleep } from "k6";

const API = __ENV.API_URL || "http://localhost:8080/api/v1";

export const options = {
  vus:      100,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(99)<300"],
    http_req_failed:   ["rate<0.005"],
  },
};

export default function () {
  // Test OTP send
  const phone = `+9989${Math.floor(10000000 + Math.random() * 89999999)}`;
  const res = http.post(`${API}/auth/send-otp`, JSON.stringify({ phone }), {
    headers: { "Content-Type": "application/json" },
  });
  check(res, { "OTP send OK": r => r.status === 200 });
  sleep(0.5);
}
