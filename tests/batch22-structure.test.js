
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

test("batch22 policy files exist", () => {
  assert.equal(fs.existsSync(path.join(root, "AUTO_MARKET_MODE.md")), true);
  assert.equal(fs.existsSync(path.join(root, "SCHEMA_POLICY.md")), true);
});

test("market backend uses shared mode helper", () => {
  const source = read("src/modules/client/features/auto-market/services/marketBackend.js");
  assert.match(source, /from "\.\/marketMode"/);
  assert.match(source, /shouldUseMockFallback/);
  assert.match(source, /logMockFallback/);
});

test("market api seed is mode-aware", () => {
  const source = read("src/modules/client/features/auto-market/services/marketApi.js");
  assert.match(source, /from "\.\/marketMode"/);
  assert.match(source, /isAutoMarketMockMode\(\)/);
});

test("env contract includes auto market mode", () => {
  const source = read("ENV_CONTRACT.md");
  assert.match(source, /VITE_AUTO_MARKET_MODE/);
});
