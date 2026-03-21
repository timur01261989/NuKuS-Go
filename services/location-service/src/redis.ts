import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
});

export class RedisGeo {
  readonly DRIVER_GEO_KEY = "drivers:geo";
  readonly DRIVER_META_PREFIX = "driver:meta:";

  async addDriver(driverId: string, lat: number, lng: number) {
    await redis.geoadd(this.DRIVER_GEO_KEY, lng, lat, driverId);
  }

  async getRadius(lat: number, lng: number, radiusKm: number) {
    return redis.georadius(this.DRIVER_GEO_KEY, lng, lat, radiusKm, "km", "WITHCOORD", "WITHDIST", "COUNT", 50, "ASC") as any[];
  }

  async setMeta(driverId: string, meta: object) {
    await redis.setex(`${this.DRIVER_META_PREFIX}${driverId}`, 60, JSON.stringify(meta));
  }

  async getMeta(driverId: string) {
    const raw = await redis.get(`${this.DRIVER_META_PREFIX}${driverId}`);
    return raw ? JSON.parse(raw) : null;
  }
}
