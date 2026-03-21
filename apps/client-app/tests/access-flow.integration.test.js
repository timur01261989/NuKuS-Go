
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("accessState contains pending and approved driver outcomes", () => {
  const content = fs.readFileSync(path.join(root, "src/modules/shared/auth/accessState.js"), "utf8");
  assert.match(content, /mode:\s*"driver_pending"/);
  assert.match(content, /mode:\s*"driver_approved"/);
});

test("accessState routes approved drivers to canonical driver home", () => {
  const content = fs.readFileSync(path.join(root, "src/modules/shared/auth/accessState.js"), "utf8");
  assert.match(content, /ROUTES\.driver\.home/);
  assert.doesNotMatch(content, /driver\/dashboard/);
});
