import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const assetsRoot = path.join(root, 'src', 'assets', 'security');
const manifestPath = path.join(assetsRoot, 'security-assets-phase1.manifest.json');
const reportPath = path.join(root, 'BATCH45_CHANGED_FILES.txt');

const blockedParts = [
  String.fromCharCode(121, 97, 110, 100, 101, 120),
  String.fromCharCode(121, 97, 110, 103, 111),
  String.fromCharCode(121, 98, 115, 100, 107),
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

test('security assets manifest exists', () => {
  assert.equal(fs.existsSync(manifestPath), true);
});

test('security asset categories are present', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const expected = ['auth', 'payment', 'trust', 'notifications', 'scanner', 'state'];
  assert.deepEqual(Object.keys(manifest.categories), expected);
});

test('security asset files exist and use neutral paths', () => {
  const files = walk(assetsRoot).map((file) => path.relative(root, file).replaceAll('\\', '/'));
  const assetFiles = files.filter((file) => !file.endsWith('index.js') && !file.endsWith('.json'));
  assert.ok(assetFiles.length >= 100);
  for (const file of assetFiles) {
    const lower = file.toLowerCase();
    for (const part of blockedParts) {
      assert.equal(lower.includes(part), false, `blocked fragment in path: ${file}`);
    }
  }
});

test('manifest and report stay neutral', () => {
  const manifestText = fs.readFileSync(manifestPath, 'utf8').toLowerCase();
  const reportText = fs.readFileSync(reportPath, 'utf8').toLowerCase();
  for (const part of blockedParts) {
    assert.equal(manifestText.includes(part), false);
    assert.equal(reportText.includes(part), false);
  }
});

test('index exports grouped security assets', () => {
  const indexText = fs.readFileSync(path.join(assetsRoot, 'index.js'), 'utf8');
  assert.equal(indexText.includes('export const securityAssets = {'), true);
  for (const key of ['auth', 'payment', 'trust', 'notifications', 'scanner', 'state']) {
    assert.equal(indexText.includes(`${key}: {`), true);
  }
});
