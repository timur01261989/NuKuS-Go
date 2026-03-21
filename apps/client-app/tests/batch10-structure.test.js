import fs from 'fs';
import path from 'path';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('batch10 split server helper files exist', () => {
  [
    'server/api/order.shared.js',
    'server/api/auto_market.shared.js',
    'server/_shared/reward-engine/repositoryHelpers.js',
    'server/_shared/reward-engine/service.helpers.js',
  ].forEach((rel) => {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  });
});

test('batch10 main server files import extracted helpers', () => {
  const order = read('server/api/order.js');
  const autoMarket = read('server/api/auto_market.js');
  const repos = read('server/_shared/reward-engine/repositories.js');
  const service = read('server/_shared/reward-engine/service.js');

  assert.match(order, /from ['"]\.\/order\.shared\.js['"]/);
  assert.match(autoMarket, /from ['"]\.\/auto_market\.shared\.js['"]/);
  assert.match(repos, /from ['"]\.\/repositoryHelpers\.js['"]/);
  assert.match(service, /from ['"]\.\/service\.helpers\.js['"]/);
});
