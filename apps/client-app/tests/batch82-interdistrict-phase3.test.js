import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = '/mnt/data/batch80_interdistrict';

test('client active trip panel includes timeline and signal badges', () => {
  const panel = fs.readFileSync(`${base}/src/modules/client/features/client/interDistrict/components/InterDistrictActiveTripPanel.jsx`, 'utf8');
  assert.match(panel, /buildClientTripTimeline/);
  assert.match(panel, /<Steps/);
  assert.match(panel, /Haydovchi kutilmoqda/);
});

test('driver controller exposes queue health and socket meta', () => {
  const controller = fs.readFileSync(`${base}/src/modules/driver/legacy/inter-district/hooks/useDriverInterDistrictController.js`, 'utf8');
  assert.match(controller, /queueHealth/);
  assert.match(controller, /socketMeta/);
  assert.match(controller, /conflictGuard/);
});

test('trip requests drawer guards conflicting accept actions', () => {
  const drawer = fs.readFileSync(`${base}/src/modules/driver/legacy/inter-district/components/shared/TripRequestsDrawer.jsx`, 'utf8');
  assert.match(drawer, /Aktiv reys mavjud/);
  assert.match(drawer, /respondingRequestId/);
});

test('shared interdistrict signals helper exists', () => {
  const helper = `${base}/src/modules/shared/interdistrict/domain/interDistrictSignals.js`;
  assert.equal(fs.existsSync(helper), true);
  const code = fs.readFileSync(helper, 'utf8');
  assert.match(code, /buildClientTripTimeline/);
  assert.match(code, /buildQueueHealthMeta/);
  assert.match(code, /buildDriverTripPreview/);
});
