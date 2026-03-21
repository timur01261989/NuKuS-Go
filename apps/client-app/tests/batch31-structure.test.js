import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch31 payment asset integration", async (t) => {
  await t.test("adds payment registry with bonus and challenge assets", () => {
    const paymentRegistry = read("src/assets/payment/index.js");
    assert.match(paymentRegistry, /payment-loyalty-card\.svg/);
    assert.match(paymentRegistry, /payment-bonuses\.png/);
    assert.match(paymentRegistry, /payment-card-jcb\.svg/);

    const lottieRegistry = read("src/assets/lottie/index.js");
    assert.match(lottieRegistry, /payment-challenge-footer\.json/);
    assert.match(lottieRegistry, /payment-bank-select\.json/);
  });

  await t.test("wires payment assets into wallet and promo ui", () => {
    const wallet = read("src/modules/client/features/client/pages/ClientWallet.jsx");
    assert.match(wallet, /paymentAssets\.bonus/);
    assert.match(wallet, /paymentAssets\.actions\.scan/);
    assert.match(wallet, /cardBrands\.map/);

    const promo = read("src/modules/client/features/auto-market/components/Payments/PromoModal.jsx");
    assert.match(promo, /paymentAssets\.bonus\.bonusBadge/);
    assert.match(promo, /paymentAssets\.states\.warningAlt/);
  });

  await t.test("wires payment visual support into auth/register/ai ui", () => {
    const auth = read("src/modules/client/features/auth/pages/Auth.jsx");
    const register = read("src/modules/client/features/auth/pages/Register.jsx");
    const ai = read("src/modules/client/features/auto-market/components/modules/CreateAd/AiPipelineStatus.jsx");
    assert.match(auth, /paymentAssets\.cards\.defaultAlt/);
    assert.match(register, /paymentAssets\.cards\.defaultAlt/);
    assert.match(ai, /lottieAssets\.payment\.challengeFooter/);
  });
});
