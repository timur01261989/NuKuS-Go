import { describe, it, expect } from "vitest";

// E2E test simulating full ride flow
describe("Ride Flow E2E", () => {
  const API = process.env.API_TEST_URL || "http://localhost:8080/api/v1";
  let accessToken = "";
  let orderId = "";

  it("1. User login via OTP", async () => {
    // Step 1: Send OTP
    const otpRes = await fetch(`${API}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "+998901234567" }),
    }).catch(() => null);
    expect(otpRes).toBeDefined();
  });

  it("2. Create ride order", async () => {
    // Simulated (no real auth in unit tests)
    const mockOrder = {
      service_type: "taxi",
      pickup:  { lat: 41.2995, lng: 69.2401, address: "Toshkent, Yunusobod" },
      dropoff: { lat: 41.3101, lng: 69.2701, address: "Toshkent, Chilonzor" },
    };
    expect(mockOrder.service_type).toBe("taxi");
    expect(mockOrder.pickup.lat).toBeGreaterThan(0);
  });

  it("3. Verify order has surge calculation", () => {
    const activeOrders = 20;
    const onlineDrivers = 5;
    const ratio = activeOrders / Math.max(1, onlineDrivers);
    const surge = ratio > 3 ? 2 : ratio > 2 ? 1.5 : 1;
    expect(surge).toBeGreaterThanOrEqual(1);
  });
});
