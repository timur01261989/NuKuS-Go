import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("batch 26 artifacts exist", () => {
  const expected = [
    "API_CONTRACT.md",
    "FINAL_QA_CHECKLIST.md",
    "tests/api-index.contract.test.js",
    "tests/route-registry.contract.test.js",
    "tests/final-qa-docs.test.js",
  ];
  for (const file of expected) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});

test("api index exports __testables", () => {
  const content = fs.readFileSync(path.join(root, "api/index.js"), "utf8");
  assert.match(content, /export const __testables/);
  assert.match(content, /parseBodyFromBuffer/);
  assert.match(content, /getApiPath/);
});
