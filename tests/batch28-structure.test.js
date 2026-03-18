import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch28 asset integration", async (t) => {
  await t.test("adds expanded support/icon/lottie assets", () => {
    assert.equal(exists("src/assets/support/support-main.svg"), true);
    assert.equal(exists("src/assets/support/chat/chat-create.png"), true);
    assert.equal(exists("src/assets/icons/index.js"), true);
    assert.equal(exists("src/assets/lottie/payment/payment-card-bind.json"), true);
    assert.equal(exists("src/assets/payment/cards/payment-card-google-pay.svg"), true);
  });

  await t.test("wires support and asset pages to registries", () => {
    assert.match(read("src/modules/client/pages/pages/Support.jsx"), /supportAssets/);
    assert.match(read("src/modules/client/features/support/SupportChatPage.jsx"), /supportAssets/);
    assert.match(read("src/modules/client/features/chat/components/ChatComponent.jsx"), /supportAssets/);
    assert.match(read("src/modules/client/features/auto-market/components/modules/CreateAd/AiPipelineStatus.jsx"), /lottieAssets/);
    assert.match(read("src/modules/client/features/auto-market/components/Payments/PromoModal.jsx"), /paymentAssets/);
  });
});
