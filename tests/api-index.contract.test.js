import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("api index exports __testables helpers", () => {
  const content = fs.readFileSync(path.join(root, "api/index.js"), "utf8");
  assert.match(content, /export const __testables/);
  assert.match(content, /parseBodyFromBuffer/);
  assert.match(content, /getApiPath/);
});

test("api index contains 404 json contract for unknown routes", () => {
  const content = fs.readFileSync(path.join(root, "api/index.js"), "utf8");
  assert.match(content, /API route not found/);
  assert.match(content, /statusCode = 404/);
  assert.match(content, /Content-Type", "application\/json/);
});

test("api index supports json and urlencoded body parsing", () => {
  const content = fs.readFileSync(path.join(root, "api/index.js"), "utf8");
  assert.match(content, /application\/json/);
  assert.match(content, /application\/x-www-form-urlencoded/);
});
