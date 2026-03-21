import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Supabase
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      insert: () => ({ select: () => ({ single: () => ({ data: { id: "test-id", status: "searching" }, error: null }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: {}, error: null }) }) }) }),
      select: () => ({ eq: () => ({ single: () => ({ data: {}, error: null }) }) }),
    }),
  }),
}));

describe("Order State Machine", () => {
  it("should allow valid transitions", () => {
    const ORDER_STATES = ["CREATED","SEARCHING_DRIVER","DRIVER_OFFERED","DRIVER_ACCEPTED",
                          "DRIVER_ARRIVED","RIDE_STARTED","RIDE_COMPLETED","PAYMENT_PENDING","PAYMENT_COMPLETED"];
    const map: Record<string, string[]> = {
      CREATED:          ["SEARCHING_DRIVER"],
      SEARCHING_DRIVER: ["DRIVER_OFFERED"],
      DRIVER_OFFERED:   ["DRIVER_ACCEPTED"],
      DRIVER_ACCEPTED:  ["DRIVER_ARRIVED"],
      DRIVER_ARRIVED:   ["RIDE_STARTED"],
      RIDE_STARTED:     ["RIDE_COMPLETED"],
      RIDE_COMPLETED:   ["PAYMENT_PENDING"],
      PAYMENT_PENDING:  ["PAYMENT_COMPLETED"],
    };
    const isValid = (from: string, to: string) => (map[from] || []).includes(to);
    expect(isValid("CREATED", "SEARCHING_DRIVER")).toBe(true);
    expect(isValid("CREATED", "RIDE_STARTED")).toBe(false);
    expect(isValid("RIDE_STARTED", "RIDE_COMPLETED")).toBe(true);
  });
});

describe("Surge Pricing", () => {
  it("should compute surge multiplier correctly", () => {
    const computeSurge = ({ activeOrders = 0, onlineDrivers = 0 }) => {
      const ratio = activeOrders / Math.max(1, onlineDrivers);
      if (ratio > 5)    return 3;
      if (ratio > 3)    return 2;
      if (ratio > 2)    return 1.5;
      if (ratio > 1.25) return 1.2;
      return 1;
    };
    expect(computeSurge({ activeOrders: 10, onlineDrivers: 2 })).toBe(3);
    expect(computeSurge({ activeOrders: 5, onlineDrivers: 5 })).toBe(1);
    expect(computeSurge({ activeOrders: 0, onlineDrivers: 10 })).toBe(1);
  });
});

describe("ETA Calculation", () => {
  it("should estimate correct ETA", () => {
    const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371, toRad = (d: number) => d * Math.PI / 180;
      const dLat = toRad(lat2-lat1), dLng = toRad(lng2-lng1);
      return 2*R*Math.asin(Math.sqrt(Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2));
    };
    const dist = haversine(41.2995, 69.2401, 41.3101, 69.2701);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(5); // Should be a few km
  });
});
