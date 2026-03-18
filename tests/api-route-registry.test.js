import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("route registry file contains critical endpoint keys", () => {
  const content = fs.readFileSync(path.join(root, "api/routeRegistry.js"), "utf8");
  for (const key of [
    '"intercity"',
    '"analytics"',
    '"dispatch-enqueue"',
    '"dispatch-predictions"',
    '"dispatch-architecture"',
    '"event-stream"',
    '"push/register"',
    '"push/send"',
  ]) {
    assert.match(content, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("route registry preserves compatibility aliases", () => {
  const content = fs.readFileSync(path.join(root, "api/routeRegistry.js"), "utf8");
  assert.match(content, /"driver_heartbeat"/);
  assert.match(content, /"dispatch-match"/);
  assert.match(content, /function resolveRouteHandler/);
});
