/**
 * api/index.js
 * Universal router for compact API structure (Vercel-friendly)
 * Routes all /api/* requests to corresponding module
 */

import { logger } from "../server/_shared/logger.js";
import { normalizePath, resolveRouteHandler } from "./routeRegistry.js";

function readStream(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
    req.on("aborted", () => reject(new Error("Request aborted")));
  });
}

function parseBodyFromBuffer(buf, contentType) {
  const ct = String(contentType || "").toLowerCase();
  if (!buf || buf.length === 0) return undefined;

  if (ct.includes("application/json")) {
    try {
      return JSON.parse(buf.toString("utf8"));
    } catch {
      return undefined;
    }
  }

  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(buf.toString("utf8"));
    return Object.fromEntries(params.entries());
  }

  return buf;
}

async function ensureParsedBody(req) {
  if (req.body !== undefined) return;
  try {
    const buf = await readStream(req);
    req.rawBody = buf;
    req.body = parseBodyFromBuffer(buf, req.headers?.["content-type"]);
  } catch (error) {
    req.body = undefined;
    req.rawBody = Buffer.alloc(0);
    logger.warn("api_read_body_failed", { message: error?.message || String(error) });
  }
}

function getApiPath(req) {
  const url = req.url || "";
  const parsed = normalizePath(url.replace(/^\/api\/?/u, ""));
  return parsed;
}

export default async function handler(req, res) {
  const path = getApiPath(req);
  const moduleHandler = resolveRouteHandler(path);

  if (!moduleHandler) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "API route not found", path }));
    return;
  }

  await ensureParsedBody(req);
  return moduleHandler(req, res);
}


export const __testables = {
  parseBodyFromBuffer,
  getApiPath,
  ensureParsedBody,
};
