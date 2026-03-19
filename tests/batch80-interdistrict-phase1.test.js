import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = '/mnt/data/batch80_interdistrict';

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('shared interdistrict status domain exists', () => {
  const content = read('src/modules/shared/interdistrict/domain/interDistrictStatuses.js');
  assert.match(content, /INTERDISTRICT_TRIP_STATUS/);
  assert.match(content, /mapTripStatusToClientStep/);
  assert.match(content, /mapTripStatusToDriverStep/);
});

test('driver trip create modal uses real api call', () => {
  const content = read('src/modules/driver/legacy/inter-district/components/shared/TripCreateModal.jsx');
  assert.match(content, /createInterDistrictTrip/);
});

test('client controller restores active trip from server source of truth', () => {
  const content = read('src/modules/client/features/client/interDistrict/hooks/useInterDistrictController.js');
  assert.match(content, /getClientActiveTrip/);
  assert.match(content, /setActiveTripRequest/);
  assert.match(content, /normalizeInterDistrictStatus/);
});

test('shared interdistrict trips exposes active-trip and cancel helpers', () => {
  const content = read('src/modules/client/features/shared/interDistrictTrips.js');
  assert.match(content, /export async function getClientActiveTrip/);
  assert.match(content, /export async function cancelTripRequest/);
});
