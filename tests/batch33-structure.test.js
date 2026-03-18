import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch33 remaining modules assets integration", async (t) => {
  await t.test("adds profile and promo registries", () => {
    assert.equal(fs.existsSync(path.join(root, "src/assets/profile/index.js")), true);
    assert.equal(fs.existsSync(path.join(root, "src/assets/promo/index.js")), true);
  });

  await t.test("wires remaining assets into key UI files", () => {
    assert.match(read("src/modules/client/features/client/pages/ClientReferral.jsx"), /promoAssets/);
    assert.match(read("src/modules/client/pages/pages/dashboard.sections.jsx"), /profileAssets/);
    assert.match(read("src/modules/client/pages/pages/mainPage.sections.jsx"), /profileAssets/);
    assert.match(read("src/modules/client/features/support/SupportChatPage.jsx"), /ratingStars/);
  });

  await t.test("contains no legacy vendor marker strings in modified runtime files", () => {
    const files = [
      "src/assets/profile/index.js",
      "src/assets/promo/index.js",
      "src/assets/support/index.js",
      "src/assets/payment/index.js",
      "src/modules/client/features/client/pages/ClientReferral.jsx",
      "src/modules/client/pages/pages/mainPage.sections.jsx",
      "src/modules/client/pages/pages/dashboard.sections.jsx",
      "src/modules/client/features/support/SupportChatPage.jsx",
      "src/modules/client/features/chat/components/ChatComponent.jsx",
    ];
    for (const rel of files) {
      const text = read(rel).toLowerCase();
      assert.equal(text.includes("legacy-vendor"), false);
      assert.equal(text.includes("legacylegacy"), false);
    }
  });
});
