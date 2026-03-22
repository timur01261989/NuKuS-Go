import { createClient } from "@supabase/supabase-js";
import IORedis from "ioredis";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

export interface ConfigEntry {
  key:         string;
  value:       any;
  type:        "string" | "number" | "boolean" | "json";
  description: string;
  environment: "all" | "prod" | "dev" | "staging";
  is_secret:   boolean;
  version:     number;
  updated_at:  string;
  updated_by?: string;
}

// ── Default platform configs ──────────────────────────────────────────────────
const DEFAULTS: Record<string, Omit<ConfigEntry, "version" | "updated_at">> = {
  "tariff.taxi.base_price_uzs":     { key: "tariff.taxi.base_price_uzs",     value: 5000,  type: "number",  description: "Taksi asosiy narxi",               environment: "all", is_secret: false },
  "tariff.taxi.per_km_uzs":         { key: "tariff.taxi.per_km_uzs",         value: 2000,  type: "number",  description: "Km uchun narx",                    environment: "all", is_secret: false },
  "tariff.taxi.per_min_uzs":        { key: "tariff.taxi.per_min_uzs",        value: 300,   type: "number",  description: "Daqiqa uchun narx",                environment: "all", is_secret: false },
  "tariff.taxi.min_fare_uzs":       { key: "tariff.taxi.min_fare_uzs",       value: 8000,  type: "number",  description: "Minimal narx",                     environment: "all", is_secret: false },
  "surge.max_multiplier":           { key: "surge.max_multiplier",           value: 2.5,   type: "number",  description: "Maksimal surge koeffitsienti",     environment: "all", is_secret: false },
  "surge.enabled":                  { key: "surge.enabled",                  value: true,  type: "boolean", description: "Surge pricing yoqilgan/o'chirilgan",environment: "all", is_secret: false },
  "dispatch.radius_km":             { key: "dispatch.radius_km",             value: 5,     type: "number",  description: "Haydovchi qidirish radiusi",        environment: "all", is_secret: false },
  "dispatch.max_wait_sec":          { key: "dispatch.max_wait_sec",          value: 120,   type: "number",  description: "Maksimal kutish vaqti",             environment: "all", is_secret: false },
  "dispatch.algorithm":             { key: "dispatch.algorithm",             value: "smart",type: "string", description: "Dispatch algoritmi (smart/nearest)", environment: "all", is_secret: false },
  "cancellation.free_window_sec":   { key: "cancellation.free_window_sec",   value: 120,   type: "number",  description: "Bepul bekor qilish oynasi (sek)",  environment: "all", is_secret: false },
  "cancellation.penalty_uzs":       { key: "cancellation.penalty_uzs",       value: 3000,  type: "number",  description: "Bekor qilish jarima",              environment: "all", is_secret: false },
  "referral.bonus_referrer_uzs":    { key: "referral.bonus_referrer_uzs",    value: 10000, type: "number",  description: "Tavsiya uchun bonus",              environment: "all", is_secret: false },
  "referral.bonus_new_user_uzs":    { key: "referral.bonus_new_user_uzs",    value: 5000,  type: "number",  description: "Yangi foydalanuvchi bonusi",        environment: "all", is_secret: false },
  "maintenance.enabled":            { key: "maintenance.enabled",            value: false, type: "boolean", description: "Sayt texnik ta'mirda",             environment: "all", is_secret: false },
  "maintenance.message":            { key: "maintenance.message",            value: "Texnik ishlar olib borilmoqda", type: "string", description: "Texnik xabar", environment: "all", is_secret: false },
  "gps.batch_size":                 { key: "gps.batch_size",                 value: 10,    type: "number",  description: "GPS batch size",                   environment: "all", is_secret: false },
  "gps.stationary_interval_ms":     { key: "gps.stationary_interval_ms",     value: 30000, type: "number",  description: "GPS stationary interval",          environment: "all", is_secret: false },
  "driver.online_timeout_min":      { key: "driver.online_timeout_min",      value: 5,     type: "number",  description: "Haydovchi offline timeout",         environment: "all", is_secret: false },
  "order.offer_timeout_sec":        { key: "order.offer_timeout_sec",        value: 20,    type: "number",  description: "Offer qabul qilish muddati",       environment: "all", is_secret: false },
};

export class ConfigService {

  async get(key: string): Promise<any> {
    // L1: Redis
    const cached = await redis.get(`config:${key}`).catch(() => null);
    if (cached) return JSON.parse(cached).value;

    // L2: DB
    const { data } = await sb.from("platform_config").select("value, type").eq("key", key).single();
    if (data) {
      await redis.setex(`config:${key}`, 300, JSON.stringify(data));
      return this._parseValue((data as any).value, (data as any).type);
    }

    // L3: Defaults
    const def = DEFAULTS[key];
    return def ? def.value : null;
  }

  async getAll(prefix?: string): Promise<Record<string, any>> {
    const { data } = await sb.from("platform_config").select("*").order("key");
    const result: Record<string, any> = {};
    const entries = data || [];

    // Merge with defaults
    for (const [k, def] of Object.entries(DEFAULTS)) {
      if (!prefix || k.startsWith(prefix)) {
        result[k] = def.value;
      }
    }
    for (const entry of entries as any[]) {
      if (!prefix || entry.key.startsWith(prefix)) {
        result[entry.key] = this._parseValue(entry.value, entry.type);
      }
    }
    return result;
  }

  async set(key: string, value: any, updatedBy?: string): Promise<void> {
    const def  = DEFAULTS[key];
    const type = def?.type || typeof value;

    await sb.from("platform_config").upsert({
      key, value: String(value), type,
      description:  def?.description || "",
      environment:  def?.environment || "all",
      is_secret:    def?.is_secret   || false,
      version:      (await this._getVersion(key)) + 1,
      updated_at:   new Date().toISOString(),
      updated_by:   updatedBy,
    }, { onConflict: "key" });

    // Invalidate cache
    await redis.del(`config:${key}`);
    // Broadcast change to all services
    await redis.publish("config:changed", JSON.stringify({ key, value }));
  }

  async initDefaults(): Promise<void> {
    for (const [key, def] of Object.entries(DEFAULTS)) {
      const { data } = await sb.from("platform_config").select("key").eq("key", key).single();
      if (!data) {
        await sb.from("platform_config").insert({
          key, value: String(def.value), type: def.type,
          description: def.description, environment: def.environment,
          is_secret: def.is_secret, version: 1,
          updated_at: new Date().toISOString(),
        });
      }
    }
    console.warn("[config-service] Defaults initialized");
  }

  private _parseValue(value: string, type: string): any {
    if (type === "number")  return Number(value);
    if (type === "boolean") return value === "true";
    if (type === "json")    return JSON.parse(value);
    return value;
  }

  private async _getVersion(key: string): Promise<number> {
    const { data } = await sb.from("platform_config").select("version").eq("key", key).single();
    return (data as any)?.version || 0;
  }
}
