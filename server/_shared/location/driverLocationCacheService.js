/*
Production safe driver location handling.
DB write every few seconds kills PostgreSQL.
Locations should live in Redis / memory cache.
*/

export class DriverLocationCache {
  constructor(redis, geoService = null) {
    this.redis = redis;
    this.geoService = geoService;
    this.key = "driver_locations";
  }

  async updateLocation(driverId, lat, lng, meta = {}) {
    if (!this.redis || !driverId || lat == null || lng == null) return false;
    const payload = JSON.stringify({
      lat: Number(lat),
      lng: Number(lng),
      ...meta,
      ts: Date.now(),
    });

    await this.redis.hset(this.key, String(driverId), payload);

    if (this.geoService) {
      await this.geoService.upsertDriver(driverId, lat, lng, meta).catch(() => null);
    }

    return true;
  }

  async getLocation(driverId) {
    if (!this.redis || !driverId) return null;
    const row = await this.redis.hget(this.key, String(driverId));
    return row ? JSON.parse(row) : null;
  }

  async getMany(driverIds = []) {
    if (!this.redis || !Array.isArray(driverIds) || !driverIds.length) return [];
    const values = await Promise.all(driverIds.map((id) => this.getLocation(id)));
    return values.filter(Boolean);
  }
}
