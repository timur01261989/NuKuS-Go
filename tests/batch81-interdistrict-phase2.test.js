
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const base = '/mnt/data/batch80_interdistrict';

test('client interdistrict page is split into controller and view sections', () => {
  const page = fs.readFileSync(`${base}/src/modules/client/features/client/interDistrict/ClientInterDistrictPage.jsx`, 'utf8');
  assert.match(page, /useInterDistrictController/);
  assert.match(page, /InterDistrictSearchPanel/);
  assert.match(page, /InterDistrictResultsSection/);
  assert.match(page, /InterDistrictActiveTripPanel/);
});

test('driver interdistrict page is split into controller and panels', () => {
  const page = fs.readFileSync(`${base}/src/modules/driver/legacy/inter-district/InterDistrictPage.jsx`, 'utf8');
  assert.match(page, /useDriverInterDistrictController/);
  assert.match(page, /DriverActiveTripPanel/);
  assert.match(page, /DriverTripModePanels/);
});

test('new split files exist', () => {
  const files = [
    'src/modules/client/features/client/interDistrict/hooks/useInterDistrictController.js',
    'src/modules/client/features/client/interDistrict/components/InterDistrictSearchPanel.jsx',
    'src/modules/client/features/client/interDistrict/components/InterDistrictResultsSection.jsx',
    'src/modules/client/features/client/interDistrict/components/InterDistrictActiveTripPanel.jsx',
    'src/modules/driver/legacy/inter-district/hooks/useDriverInterDistrictController.js',
    'src/modules/driver/legacy/inter-district/components/panels/DriverActiveTripPanel.jsx',
    'src/modules/driver/legacy/inter-district/components/panels/DriverTripModePanels.jsx',
  ];
  for (const rel of files) {
    assert.equal(fs.existsSync(`${base}/${rel}`), true, rel);
  }
});
