import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "src/assets/essentials/essentials-assets-phase1.manifest.json");
const indexPath = path.join(root, "src/assets/essentials/index.js");
const guidanceFiles = [
  "src/modules/client/features/auth/profileVerificationGuidance.js",
  "src/modules/client/features/support/supportExperienceGuidance.js",
  "src/modules/client/features/payments/paymentFinanceGuidance.js",
  "src/modules/client/features/client/pages/clientRewardsServicesGuidance.js"
];
const blockedFragments = [
  [121, 97, 110, 100, 101, 120],
  [121, 97, 97, 110, 100, 101, 120],
  [121, 97, 110, 103, 111]
].map((codes) => String.fromCharCode(...codes));
const blockedPattern = new RegExp(blockedFragments.join("|"), "i");

test("batch51 manifest and index exist", () => {
  assert.equal(fs.existsSync(manifestPath), true);
  assert.equal(fs.existsSync(indexPath), true);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.assetGroup, "essentials-phase1");
  assert.ok(manifest.counts.auth >= 4);
  assert.ok(manifest.counts.support >= 10);
  assert.ok(manifest.counts.finance >= 10);
  assert.ok(manifest.counts.loyalty >= 8);
  assert.ok(manifest.counts.auto >= 8);
  assert.ok(manifest.counts.core >= 8);
});

test("batch51 guidance files exist and stay neutral", () => {
  for (const rel of guidanceFiles) {
    const filePath = path.join(root, rel);
    assert.equal(fs.existsSync(filePath), true, rel);
    const content = fs.readFileSync(filePath, "utf8");
    assert.equal(blockedPattern.test(content), false, rel);
  }
});

test("batch51 asset filenames stay neutral", () => {
  const assetDir = path.join(root, "src/assets/essentials");
  const bad = [];
  const stack = [assetDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (blockedPattern.test(entry.name)) bad.push(full);
    }
  }
  assert.deepEqual(bad, []);
});
