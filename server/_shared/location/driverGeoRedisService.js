export class DriverGeoRedisService {
  constructor(redis, geoKey = "driver_geo") {
    this.redis = redis;
    this.geoKey = geoKey;
  }

  async upsertDriver(driverId, lat, lng, meta = {}) {
    if (!this.redis || !driverId || lat == null || lng == null) return false;

    const payload = JSON.stringify({
      driver_id: driverId,
      lat: Number(lat),
      lng: Number(lng),
      ...meta,
      ts: Date.now(),
    });

    await this.redis.geoadd(this.geoKey, Number(lng), Number(lat), String(driverId));
    await this.redis.hset(`${this.geoKey}:meta`, String(driverId), payload);
    return true;
  }

  async removeDriver(driverId) {
    if (!this.redis || !driverId) return false;
    await this.redis.zrem(this.geoKey, String(driverId));
    await this.redis.hdel(`${this.geoKey}:meta`, String(driverId));
    return true;
  }

  async radiusSearch(lat, lng, radiusKm, count = 20) {
    if (!this.redis || lat == null || lng == null) return [];

    const ids = await this.redis.georadius(
      this.geoKey,
      Number(lng),
      Number(lat),
      Number(radiusKm),
      "km",
      "WITHDIST",
      "COUNT",
      Number(count),
      "ASC"
    );

    if (!Array.isArray(ids) || !ids.length) return [];

    const results = [];
    for (const row of ids) {
      const driverId = Array.isArray(row) ? row[0] : row;
      const distanceKm = Array.isArray(row) ? Number(row[1] || 0) : null;
      const meta = await this.redis.hget(`${this.geoKey}:meta`, String(driverId));
      const parsed = meta ? JSON.parse(meta) : {};
      results.push({
        driver_id: String(driverId),
        distance_km: distanceKm,
        ...parsed,
      });
    }

    return results;
  }
}
