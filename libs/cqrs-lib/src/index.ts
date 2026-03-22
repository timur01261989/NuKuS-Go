/**
 * CQRS Library — Command/Query separation
 * Commands → write model (Supabase primary)
 * Queries  → read model (Redis cache + read replica)
 */

import IORedis from "ioredis";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Read replica for queries ────────────────────────────────────────
let readClient: SupabaseClient | null = null;
export function getReadDB(): SupabaseClient {
  if (!readClient) {
    // Use read replica URL if available, fallback to primary
    const readUrl = process.env.SUPABASE_READ_URL || process.env.SUPABASE_URL || "";
    readClient = createClient(readUrl, process.env.SUPABASE_ANON_KEY || "");
  }
  return readClient;
}

// ── Write client (primary DB) ───────────────────────────────────────
let writeClient: SupabaseClient | null = null;
export function getWriteDB(): SupabaseClient {
  if (!writeClient) {
    writeClient = createClient(
      process.env.SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
  }
  return writeClient;
}

// ── Redis read cache ────────────────────────────────────────────────
const redis = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

// ── Command handler ─────────────────────────────────────────────────
type CommandHandler<C, R> = (command: C, db: SupabaseClient) => Promise<R>;
const commandHandlers = new Map<string, CommandHandler<any, any>>();

export function registerCommand<C, R>(name: string, handler: CommandHandler<C, R>): void {
  commandHandlers.set(name, handler);
}

export async function dispatch<C, R>(commandName: string, command: C): Promise<R> {
  const handler = commandHandlers.get(commandName);
  if (!handler) throw new Error(`No handler for command: ${commandName}`);
  const db = getWriteDB();
  const result = await handler(command, db);
  // Invalidate related caches
  const cacheKey = `cmd:invalidate:${commandName}`;
  await redis.publish(cacheKey, JSON.stringify({ command: commandName, ts: Date.now() }));
  return result as R;
}

// ── Query handler (with caching) ────────────────────────────────────
type QueryHandler<Q, R> = (query: Q, db: SupabaseClient) => Promise<R>;
const queryHandlers = new Map<string, QueryHandler<any, any>>();

export function registerQuery<Q, R>(name: string, handler: QueryHandler<Q, R>): void {
  queryHandlers.set(name, handler);
}

export async function query<Q, R>(
  queryName: string, q: Q, ttlSeconds = 30
): Promise<R> {
  const handler = queryHandlers.get(queryName);
  if (!handler) throw new Error(`No handler for query: ${queryName}`);

  // Check cache
  const cacheKey = `query:${queryName}:${JSON.stringify(q)}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as R;
  } catch {}

  // Execute query on read replica
  const db     = getReadDB();
  const result = await handler(q, db);

  // Cache result
  try {
    await redis.setex(cacheKey, ttlSeconds, JSON.stringify(result));
  } catch {}

  return result;
}

// ── Projection updater (updates read model after writes) ────────────
export async function updateProjection(key: string, data: object, ttlSeconds = 300): Promise<void> {
  await redis.setex(`projection:${key}`, ttlSeconds, JSON.stringify(data));
}

export async function getProjection<T>(key: string): Promise<T | null> {
  const val = await redis.get(`projection:${key}`);
  return val ? JSON.parse(val) as T : null;
}
