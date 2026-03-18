import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch40 realtime assets phase2 ui integration", async (t) => {
  await t.test("barrel exports grouped realtimeAssets object without duplicate phase1 alias breakage", () => {
    const barrel = read("src/assets/realtime/index.js");
    assert.equal(barrel.includes("export const realtimeAssets = {"), true);
    assert.equal((barrel.match(/export \{ default as statusSchedule \}/g) || []).length, 1);
  });

  await t.test("support and chat surfaces consume realtime assets", () => {
    const support = read("src/modules/client/pages/pages/Support.jsx");
    const supportChat = read("src/modules/client/features/support/SupportChatPage.jsx");
    const chat = read("src/modules/client/features/chat/components/ChatComponent.jsx");
    assert.equal(support.includes('from "@/assets/realtime"'), true);
    assert.equal(support.includes("realtimeAssets.status.statusScheduleCheck"), true);
    assert.equal(supportChat.includes("realtimeAssets.chat.chatCreateThread"), true);
    assert.equal(supportChat.includes("realtimeAssets.chat.chatSendMessage"), true);
    assert.equal(chat.includes("realtimeAssets.chat.chatJumpLastMessage"), true);
    assert.equal(chat.includes("realtimeAssets.chat.chatSendMessage"), true);
  });

  await t.test("map and delivery surfaces consume realtime assets", () => {
    const mapControls = read("src/modules/client/features/map/controls/MapRightControls.jsx");
    const courierMarker = read("src/modules/client/features/client/delivery/map/CourierMarker.jsx");
    const courierInfo = read("src/modules/client/features/client/delivery/components/Active/CourierInfoCard.jsx");
    const timeline = read("src/modules/client/features/client/delivery/components/Active/StatusTimeline.jsx");
    assert.equal(mapControls.includes("realtimeAssets.navigation.trackingUserFocus"), true);
    assert.equal(courierMarker.includes("realtimeAssets.markers.markerDriver"), true);
    assert.equal(courierInfo.includes("resolveCourierTier"), true);
    assert.equal(timeline.includes("realtimeAssets.status.statusScheduleCheck"), true);
  });

  await t.test("notifications service exposes realtime visual resolver", () => {
    const service = read("src/services/notifications.js");
    assert.equal(service.includes("export function getNotificationVisual"), true);
    assert.equal(service.includes("realtimeAssets.notifications.notifyBellUnread"), true);
  });
});
