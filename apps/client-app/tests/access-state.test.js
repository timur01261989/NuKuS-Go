import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("accessState defines canonical driver and pending route targets", () => {
  const content = fs.readFileSync(path.join(root, "src/modules/shared/auth/accessState.js"), "utf8");
  assert.match(content, /ROUTES\.driver\.home/);
  assert.match(content, /ROUTES\.driver\.pending/);
});

test("accessState keeps explicit approved, pending, rejected status sets", () => {
  const content = fs.readFileSync(path.join(root, "src/modules/shared/auth/accessState.js"), "utf8");
  assert.match(content, /APPROVED_STATUSES/);
  assert.match(content, /PENDING_STATUSES/);
  assert.match(content, /REJECTED_STATUSES/);
});
