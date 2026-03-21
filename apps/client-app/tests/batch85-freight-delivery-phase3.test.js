import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("shared realtime telemetry helper exists", () => {
  const code = read("src/modules/shared/domain/logistics/realtimeTelemetry.js");
  assert.match(code, /shouldPauseRealtime/);
  assert.match(code, /buildRealtimeEventSignature/);
  assert.match(code, /buildHeartbeatMeta/);
});

test("delivery parcel socket has dedupe and visibility pause", () => {
  const code = read("src/modules/driver/legacy/delivery-integration/hooks/useParcelSocket.js");
  assert.match(code, /buildRealtimeEventSignature/);
  assert.match(code, /visibilitychange/);
  assert.match(code, /duplicate/);
});

test("freight socket has dedupe and visibility pause", () => {
  const code = read("src/modules/driver/legacy/freight/hooks/useFreightSocket.js");
  assert.match(code, /buildRealtimeEventSignature/);
  assert.match(code, /visibilitychange/);
});

test("delivery page controller exposes telemetry meta", () => {
  const code = read("src/modules/client/features/client/delivery/hooks/useDeliveryPageController.js");
  assert.match(code, /telemetryMeta/);
  assert.match(code, /buildRealtimeMeta/);
});

test("freight status deck shows connection and heartbeat badges", () => {
  const code = read("src/modules/driver/legacy/freight/components/FreightStatusDeck.jsx");
  assert.match(code, /connectionMeta/);
  assert.match(code, /heartbeatMeta/);
});
