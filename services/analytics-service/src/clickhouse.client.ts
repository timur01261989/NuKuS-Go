import { createClient } from "@clickhouse/client";

export const clickhouse = createClient({
  url:      process.env.CLICKHOUSE_URL      || "http://clickhouse:8123",
  username: process.env.CLICKHOUSE_USER     || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
  database: process.env.CLICKHOUSE_DB       || "unigo",
  clickhouse_settings: {
    async_insert: 1,
    wait_for_async_insert: 0,
  },
});

export async function initSchema() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS order_events (
      event_id    UUID DEFAULT generateUUIDv4(),
      order_id    String,
      user_id     String,
      driver_id   Nullable(String),
      service     LowCardinality(String),
      event_type  LowCardinality(String),
      status      LowCardinality(String),
      price_uzs   UInt64,
      lat         Nullable(Float64),
      lng         Nullable(Float64),
      city        LowCardinality(String),
      ts          DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(ts)
    ORDER BY (service, ts, order_id)`,

    `CREATE TABLE IF NOT EXISTS driver_location_events (
      driver_id   String,
      lat         Float64,
      lng         Float64,
      bearing     Float32,
      speed       Float32,
      ts          DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMMDD(ts)
    ORDER BY (driver_id, ts)
    TTL ts + INTERVAL 30 DAY`,

    `CREATE TABLE IF NOT EXISTS payment_events (
      payment_id  UUID DEFAULT generateUUIDv4(),
      order_id    String,
      user_id     String,
      provider    LowCardinality(String),
      amount_uzs  UInt64,
      status      LowCardinality(String),
      ts          DateTime DEFAULT now()
    ) ENGINE = MergeTree()
    PARTITION BY toYYYYMM(ts)
    ORDER BY (provider, ts)`,
  ];

  for (const q of queries) {
    await clickhouse.command({ query: q });
  }
  console.warn("[analytics] ClickHouse schema ready");
}
