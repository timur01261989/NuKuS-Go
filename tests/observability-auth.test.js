import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("observability route contains reusable admin profile helper", () => {
  const content = fs.readFileSync(path.join(root, "server/api/observability.js"), "utf8");
  assert.match(content, /export function isObservabilityAdminProfile/);
  assert.match(content, /role === "admin"/);
});

test("observability route denies non-admin access", () => {
  const content = fs.readFileSync(path.join(root, "server/api/observability.js"), "utf8");
  assert.match(content, /403/);
  assert.match(content, /forbidden/);
});
