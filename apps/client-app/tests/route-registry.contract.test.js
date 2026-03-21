import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const content = fs.readFileSync(path.join(root, "api/routeRegistry.js"), "utf8");

test("route registry keeps canonical and alias route keys", () => {
  for (const key of [
    '"dispatch-enqueue"',
    '"dispatch_enqueue"',
    '"dispatch-predictions"',
    '"dispatch_predictions"',
    '"dispatch-architecture"',
    '"dispatch_architecture"',
    '"push/register"',
    '"push_send"',
    '"driver-heartbeat"',
    '"driver_heartbeat"',
  ]) {
    assert.match(content, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("route registry has auto-market subroute fallback and root-segment resolution", () => {
  assert.match(content, /normalized\.split\("\/"\)\[0\]/);
  assert.match(content, /normalized\.startsWith\("auto-market\/"\)/);
  assert.match(content, /normalized\.startsWith\("auto_market\/"\)/);
});

test("route registry returns null for unknown route", () => {
  assert.match(content, /return null;/);
});
