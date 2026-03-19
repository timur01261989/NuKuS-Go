import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("final QA and API contract docs exist", () => {
  for (const file of ["API_CONTRACT.md", "FINAL_QA_CHECKLIST.md", "AUTH_ACCESS_MODEL.md", "ROUTING_RULES.md", "ENV_CONTRACT.md", "SCHEMA_POLICY.md"]) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});

test("final QA checklist mentions critical payment and api checks", () => {
  const content = fs.readFileSync(path.join(root, "FINAL_QA_CHECKLIST.md"), "utf8");
  assert.match(content, /Duplicate capture is blocked/);
  assert.match(content, /Unknown API route returns 404 JSON/);
});
