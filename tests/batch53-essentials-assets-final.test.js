
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('batch53 final essentials screens use guidance-driven integrations', () => {
  const checks = [
    ['src/modules/client/features/auth/pages/Auth.jsx', /profileVerificationSteps|buildProfileTrustState/],
    ['src/modules/client/features/auth/pages/Register.jsx', /registerTrustState|profileVerificationSteps/],
    ['src/modules/client/features/client/pages/ClientProfile.jsx', /buildRewardsDashboard/],
    ['src/modules/client/features/client/pages/ClientPromo.jsx', /loyaltyTiers|buildRewardsDashboard/],
    ['src/modules/client/pages/pages/Support.jsx', /supportEntryPoints|buildSupportSurface/],
  ];
  for (const [rel, pattern] of checks) {
    assert.match(read(rel), pattern);
  }
});

test('batch53 touched files keep forbidden vendor tokens out', () => {
  const files = [
    'src/modules/client/features/auth/pages/Auth.jsx',
    'src/modules/client/features/auth/pages/Register.jsx',
    'src/modules/client/features/client/pages/ClientProfile.jsx',
    'src/modules/client/features/client/pages/ClientPromo.jsx',
    'src/modules/client/pages/pages/Support.jsx',
    'tests/batch52-essentials-assets-phase2.test.js',
    'src/modules/client/features/auth/profileVerificationGuidance.js',
  ];
  const forbiddenTokens = ['yan' + 'dex', 'yaa' + 'ndex', 'yan' + 'go'];
  for (const rel of files) {
    const content = read(rel).toLowerCase();
    for (const token of forbiddenTokens) {
      assert.equal(content.includes(token), false, `${rel}:${token}`);
    }
  }
});
