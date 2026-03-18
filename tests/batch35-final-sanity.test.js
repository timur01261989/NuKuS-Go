import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

test("batch35 final sanity", async (t) => {
  await t.test("keeps selected integrated assets present", () => {
    const mustExist = [
      "src/assets/integrated/payment/finance-top-up.svg",
      "src/assets/integrated/support/support-help-badge.svg",
      "src/assets/integrated/auth/auth-onboarding-taxi.webp",
      "src/assets/integrated/promo/promo-invite-banner.webp",
      "src/assets/integrated/map/map-control-location.png",
    ];
    for (const rel of mustExist) {
      assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
    }
  });

  await t.test("keeps changed-files manifests aligned with clean packaging", () => {
    assert.equal(fs.existsSync(path.join(root, "BATCH33_CHANGED_FILES.txt")), true);
    assert.equal(fs.existsSync(path.join(root, "BATCH34_CHANGED_FILES.txt")), true);
    assert.equal(fs.existsSync(path.join(root, "BATCH35_FINAL_CHANGED_FILES.txt")), true);
    assert.equal(fs.existsSync(path.join(root, "node_modules")), false);
  });
});
