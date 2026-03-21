import { RedisGeo } from "./redis";

export class SpatialService {
  constructor(private geo: RedisGeo) {}

  async updateDriverLocation(driverId: string, lat: number, lng: number, bearing = 0, speed = 0) {
    await Promise.all([
      this.geo.addDriver(driverId, lat, lng),
      this.geo.setMeta(driverId, { lat, lng, bearing, speed, ts: Date.now() }),
    ]);
  }

  async getNearbyDrivers(lat: number, lng: number, radiusKm: number) {
    const results = await this.geo.getRadius(lat, lng, radiusKm);
    return results.map((r: any) => ({
      id: r[0],
      distance_km: parseFloat(r[1]),
      lng: parseFloat(r[2][0]),
      lat: parseFloat(r[2][1]),
    }));
  }

  async getDriverLocation(driverId: string) {
    return this.geo.getMeta(driverId);
  }
}
