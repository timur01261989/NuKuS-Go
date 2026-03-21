import test from "node:test";
import assert from "node:assert/strict";
import { findMatchedTrip, getDeliveryPointLabel, canSubmitDeliveryForm, createDeliveryPayload, applyDeliveryOrderToForm, DELIVERY_FORM_INITIAL } from "../src/modules/client/features/client/delivery/DeliveryPage.logic.js";
import { getInitialReferralSummaryState, buildReferralViewModel } from "../src/modules/client/features/client/pages/clientReferral.logic.js";
import { normalizeOwnReferralSnapshot, writeStorageJson, readStorageJson, removeStorageKey } from "../src/services/referralLinkService.storage.js";

test("delivery smoke: region trip matching and payload build work", () => {
  const trip = findMatchedTrip(
    [{ from_region: "Nukus", to_region: "Xiva", is_delivery: true, id: "trip1" }],
    "region",
    "Nukus",
    "Xiva"
  );
  assert.equal(trip.id, "trip1");

  const label = getDeliveryPointLabel("precise", { label: "" }, (s) => s);
  assert.match(label, /Xaritadan aniq manzil/);

  const validation = canSubmitDeliveryForm({
    senderPhone: "901234567",
    receiverPhone: "991112233",
    receiverName: "Olim",
    pickup: { region: "Nukus", district: "Center", point: { lat: 1, lng: 2 }, label: "A" },
    dropoff: { region: "Xiva", district: "Center", point: { lat: 3, lng: 4 }, label: "B" },
    serviceMode: "city",
    pickupMode: "precise",
    dropoffMode: "precise",
    t: (x) => x,
  });
  assert.equal(validation, true);

  const payload = createDeliveryPayload({
    userId: "u1",
    serviceMode: "city",
    parcelType: "document",
    parcelMeta: { label: "Hujjat" },
    weightKg: 1,
    price: 15000,
    comment: "",
    receiverName: "Olim",
    receiverPhone: "991112233",
    senderPhone: "901234567",
    pickupMode: "precise",
    dropoffMode: "precise",
    pickup: { region: "Nukus", district: "Center", point: [1, 2], label: "A" },
    dropoff: { region: "Xiva", district: "Center", point: [3, 4], label: "B" },
    pickupLabel: "A",
    dropoffLabel: "B",
    matchedTrip: null,
  });
  assert.equal(payload.created_by, "u1");
  assert.equal(payload.pickup_label, "A");
  assert.equal(payload.dropoff_label, "B");

  const state = {};
  const setState = (key, value) => { state[key] = value; };
  applyDeliveryOrderToForm({
    id: "o1",
    sender_phone: "901234567",
    receiver_phone: "991112233",
    receiver_name: "Olim",
    pickup_region: "Nukus",
    pickup_district: "Center",
    pickup_label: "A",
    pickup_lat: 1,
    pickup_lng: 2,
    dropoff_region: "Xiva",
    dropoff_district: "Center",
    dropoff_label: "B",
    dropoff_lat: 3,
    dropoff_lng: 4,
  }, setState, (v) => v);
  assert.equal(state.receiverName, "Olim");
  assert.equal(state.pickup.label, "A");
});

test("referral smoke: storage snapshot and view model work", () => {
  const memory = new Map();
  global.window = {};
  const storageImpl = {
    getItem: (k) => memory.has(k) ? memory.get(k) : null,
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
  global.localStorage = storageImpl;
  global.window.localStorage = storageImpl;

  const normalized = normalizeOwnReferralSnapshot({
    code: { code: "abc123" },
    share_url: "https://example.com/r/abc123",
    summary: { totals: { invited_count: 2, rewarded_count: 1, earned_uzs: 10000 } },
  });
  assert.equal(normalized?.code ?? normalized?.code?.code, "ABC123");

  writeStorageJson("snap", normalized);
  const readBack = readStorageJson("snap");
  assert.equal(readBack?.code ?? readBack?.code?.code, "ABC123");
  removeStorageKey("snap");
  assert.equal(readStorageJson("snap"), null);

  const initial = getInitialReferralSummaryState(() => normalized);
  const vm = buildReferralViewModel(
    initial,
    (code) => `https://example.com/r/${code}`,
    ({ code }) => ({ text: code }),
    ({ code }) => ({ telegram: code })
  );
  assert.equal(vm.canShare, true);
  assert.equal(vm.totals.invitedCount, 2);
});
