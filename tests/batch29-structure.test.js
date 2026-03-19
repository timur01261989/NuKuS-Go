import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch29 asset polish", async (t) => {
  await t.test("adds shared asset polish presets", () => {
    assert.equal(fs.existsSync(path.join(root, "src/assets/assetPolish.js")), true);
  });

  await t.test("auth pages use shared asset polish sizes", () => {
    const auth = read("src/modules/client/features/auth/pages/Auth.jsx");
    const register = read("src/modules/client/features/auth/pages/Register.jsx");
    assert.match(auth, /assetSizes\.authHeroShell/);
    assert.match(register, /assetSizes\.authHeroAnimation/);
  });

  await t.test("support and chat pages use shared asset polish styles", () => {
    const support = read("src/modules/client/pages/pages/Support.jsx");
    const supportChat = read("src/modules/client/features/support/SupportChatPage.jsx");
    const chat = read("src/modules/client/features/chat/components/ChatComponent.jsx");
    assert.match(support, /assetStyles\.supportHero/);
    assert.match(supportChat, /assetStyles\.chatAction/);
    assert.match(chat, /assetStyles\.chatAction/);
  });

  await t.test("wallet and promo views use payment polish helpers", () => {
    const wallet = read("src/modules/client/features/client/pages/ClientWallet.jsx");
    const promo = read("src/modules/client/features/auto-market/components/Payments/PromoModal.jsx");
    assert.match(wallet, /getWalletCardBrandOrder/);
    assert.match(promo, /assetStyles\.promoTitleIcon/);
  });
});
