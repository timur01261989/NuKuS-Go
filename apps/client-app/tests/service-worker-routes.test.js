import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("service worker uses canonical driver route", () => {
  const sw = fs.readFileSync(path.join(root, "public/sw.js"), "utf8");
  assert.match(sw, /\/driver/);
  assert.doesNotMatch(sw, /\/driver\/dashboard/);
});
