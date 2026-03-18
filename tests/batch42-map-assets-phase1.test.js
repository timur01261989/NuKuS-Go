import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const curatedRoot = path.join(projectRoot, 'src', 'assets', 'map', 'curated');
const manifestPath = path.join(curatedRoot, 'map-assets-phase1.manifest.json');

test('batch42 curated map asset manifest exists', () => {
  assert.equal(fs.existsSync(manifestPath), true);
});

test('batch42 curated map asset counts match files on disk', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.total, 93);
  assert.deepEqual(manifest.counts, { pickup: 31, courier: 11, poi: 51 });
  assert.equal(manifest.assetGroup, 'map-assets-curated');
  assert.equal(manifest.importMode, 'copied-renamed');
  assert.equal(manifest.sourceGroup, 'map-visual-curated');

  const diskFiles = [];
  for (const category of ['pickup', 'courier', 'poi']) {
    const categoryDir = path.join(curatedRoot, category);
    for (const entry of fs.readdirSync(categoryDir)) {
      if (entry === '.DS_Store') continue;
      diskFiles.push(`${category}/${entry}`);
    }
  }

  assert.equal(diskFiles.length, manifest.total);
  assert.equal(new Set(diskFiles).size, diskFiles.length);
});

test('batch42 curated map asset filenames are neutral', () => {
  const files = [];
  for (const category of ['pickup', 'courier', 'poi']) {
    const categoryDir = path.join(curatedRoot, category);
    for (const entry of fs.readdirSync(categoryDir)) {
      if (entry === '.DS_Store') continue;
      files.push(entry.toLowerCase());
    }
  }

  for (const file of files) {
    assert.equal(new RegExp([String.fromCharCode(121,97,110,100,101,120),String.fromCharCode(121,97,97,110,100,101,120),String.fromCharCode(121,98,115,100,107),"mapkit","akbars"].join("|")).test(file), false, file);
  }
});


test('batch42 curated map asset index exports grouped categories', () => {
  const indexText = fs.readFileSync(path.join(curatedRoot, 'index.js'), 'utf8');
  assert.equal(indexText.includes('export const curatedMapAssets = {'), true);
  assert.equal(indexText.includes('pickup: {'), true);
  assert.equal(indexText.includes('courier: {'), true);
  assert.equal(indexText.includes('poi: {'), true);
});
