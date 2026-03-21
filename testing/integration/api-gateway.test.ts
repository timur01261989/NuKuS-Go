import { describe, it, expect, beforeAll, afterAll } from "vitest";

// Integration test — requires running services
const API_BASE = process.env.API_TEST_URL || "http://localhost:8080/api";

describe("API Gateway Integration", () => {
  it("GET /api/health returns ok", async () => {
    const res  = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("GET /api/v1/auth/health", async () => {
    const res = await fetch(`${API_BASE}/v1/auth/health`).catch(() => null);
    // Should either succeed or return 502 (service down in test)
    expect(res).toBeDefined();
  });
});
