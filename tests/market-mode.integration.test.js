
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("market mode module accepts only mock/backend modes", () => {
  const content = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/services/marketMode.js"), "utf8");
  assert.match(content, /ALLOWED_MODES = new Set\(\["mock", "backend"\]\)/);
});

test("market mode module uses production-safe backend fallback", () => {
  const content = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/services/marketMode.js"), "utf8");
  assert.match(content, /fallback:\s*PRODUCTION \? "backend" : "mock"/);
  assert.match(content, /return PRODUCTION \? "backend" : "mock"/);
});
