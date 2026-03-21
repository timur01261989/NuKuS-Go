
import fs from 'fs';
import path from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('batch20 split files exist', () => {
  [
    'src/modules/client/features/client/delivery/DeliveryPage.logic.js',
    'src/modules/client/features/auth/pages/register.logic.js',
  ].forEach((rel) => {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} should exist`);
  });
});

test('delivery page uses extracted logic', () => {
  const content = read('src/modules/client/features/client/delivery/DeliveryPage.jsx');
  assert.match(content, /from "\.\/DeliveryPage\.logic"/);
  assert.match(content, /createDeliveryPayload/);
  assert.match(content, /canSubmitDeliveryForm/);
});

test('register page uses extracted logic', () => {
  const content = read('src/modules/client/features/auth/pages/Register.jsx');
  assert.match(content, /from '\.\/register\.logic\.js'/);
  assert.match(content, /buildRegisterInitialForm/);
  assert.match(content, /normalizeOtpValue/);
});
