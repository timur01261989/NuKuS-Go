
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

test('phase2 essentials imports are wired into target screens', () => {
  const files = [
    'src/modules/client/features/client/pages/ClientWallet.jsx',
    'src/modules/client/features/client/pages/ClientPaymentMethods.jsx',
    'src/modules/client/features/client/pages/ClientProfile.jsx',
    'src/modules/client/pages/pages/Support.jsx',
    'src/modules/client/features/support/SupportChatPage.jsx',
    'src/modules/client/features/client/pages/ClientPromo.jsx',
    'src/modules/client/features/payments/PaymentsModule.jsx',
  ];
  for (const rel of files) {
    const content = read(rel);
    assert.match(content, /@\/assets\/essentials/);
  }
});

test('phase2 essentials layer has no forbidden vendor literals', () => {
  const files = [
    'src/assets/essentials/index.js',
    'src/assets/essentials/essentials-assets-phase1.manifest.json',
    'tests/batch51-essentials-assets-phase1.test.js',
    'BATCH51_CHANGED_FILES.txt',
  ];
  const forbiddenTokens = ['yan' + 'dex', 'yaa' + 'ndex', 'yan' + 'go'];
  for (const rel of files) {
    const content = read(rel).toLowerCase();
    for (const token of forbiddenTokens) {
      assert.equal(content.includes(token), false, `${rel}:${token}`);
    }
  }
});
