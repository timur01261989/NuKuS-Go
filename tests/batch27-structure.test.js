import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

test("batch27 asset integration", async (t) => {
  await t.test("adds asset registries", () => {
    assert.equal(fs.existsSync(path.join(root, "src/assets/map/index.js")), true);
    assert.equal(fs.existsSync(path.join(root, "src/assets/payment/index.js")), true);
    assert.equal(fs.existsSync(path.join(root, "src/assets/lottie/index.js")), true);
  });

  await t.test("wires map assets into map-related helpers", () => {
    assert.match(read("src/modules/client/features/client/taxi/taxiMapArtifacts.jsx"), /mapAssets/);
    assert.match(read("src/modules/client/features/client/components/clientOrderCreate.helpers.js"), /mapAssets/);
    assert.match(read("src/modules/client/features/client/delivery/DeliveryPage.helpers.jsx"), /mapAssets/);
  });

  await t.test("wires lottie assets into auth and register", () => {
    assert.match(read("src/modules/client/features/auth/pages/Auth.jsx"), /lottieAssets/);
    assert.match(read("src/modules/client/features/auth/pages/Register.jsx"), /lottieAssets/);
  });

  await t.test("wires payment assets into wallet screen", () => {
    assert.match(read("src/modules/client/features/client/pages/ClientWallet.jsx"), /paymentAssets/);
  });
});
