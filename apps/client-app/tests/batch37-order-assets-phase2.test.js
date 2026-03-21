import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch37 phase2 order asset ui wiring", async (t) => {
  await t.test("wires order asset registry into support, chat, history, and courier ui", () => {
    const supportPage = read("src/modules/client/pages/pages/Support.jsx");
    const supportChat = read("src/modules/client/features/support/SupportChatPage.jsx");
    const chatComponent = read("src/modules/client/features/chat/components/ChatComponent.jsx");
    const tripHistory = read("src/modules/client/features/client/components/TripHistory.jsx");
    const courierInfo = read("src/modules/client/features/client/delivery/components/Active/CourierInfoCard.jsx");
    const courierMarker = read("src/modules/client/features/client/delivery/map/CourierMarker.jsx");
    const deliveryMap = read("src/modules/client/features/client/delivery/map/DeliveryMap.jsx");

    assert.match(supportPage, /orderAssets\.history\.orderSchedule/);
    assert.match(supportPage, /orderAssets\.courier\.orderProgressPin/);
    assert.match(supportChat, /orderAssets\.chat\.chatSupportPhone/);
    assert.match(supportChat, /orderAssets\.history\.orderSupportAlt/);
    assert.match(chatComponent, /orderAssets\.chat\.chatJumpLastMessage/);
    assert.match(chatComponent, /ATTACHMENT_ACTIONS/);
    assert.match(tripHistory, /orderAssets\.history\.orderShare/);
    assert.match(tripHistory, /resolveStatusIcon/);
    assert.match(courierInfo, /orderAssets\.tracking\.courierDeli/);
    assert.match(courierMarker, /resolveCourierMarker/);
    assert.match(deliveryMap, /vehicle=\{courier\.vehicle \|\| courier\.transport \|\| courier\.mode\}/);
  });

  await t.test("keeps unwanted payment card assets excluded from order asset layer", () => {
    const orderAssetTree = fs.readdirSync(path.join(root, "src/assets/order/chat"));
    const blocked = ["card_mastercard.png", "card_mir.png", "card_unionpay.png", "card_visa.png", "card_none.png"];
    for (const entry of blocked) {
      assert.equal(orderAssetTree.includes(entry), false, entry);
    }
  });
});
