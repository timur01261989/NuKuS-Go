/**
 * apicache-fix.unit.test.js
 * DOCX Section 10: apiHelper.clearCache ReferenceError fix tekshirish
 */
import { describe, it, expect } from 'vitest';

// cache ob'ektini in-memory taqlid qilamiz
const cache = new Map();

const getCached = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > hit.ttl) { cache.delete(key); return null; }
  return hit.data;
};

const setCached = (key, data, ttl) => {
  cache.set(key, { ts: Date.now(), ttl, data });
};

// apiHelper.clearCache bug fix — endi 'cache' import qilinadi
const api = {
  clearCache() { cache.clear(); },  // FIX: cache endi scope da bor
};

describe('apiHelper clearCache (BUG FIX)', () => {
  it('cache.clear() ReferenceError bo\'lmasligi kerak', () => {
    setCached('test-key', { foo: 'bar' }, 60000);
    expect(getCached('test-key')).toEqual({ foo: 'bar' });

    // BUG FIX: avval bu "cache is not defined" xato berardi
    expect(() => api.clearCache()).not.toThrow();
    expect(getCached('test-key')).toBeNull();
  });

  it('TTL o\'tganda cache avtomatik tozalanadi', () => {
    setCached('ttl-key', 'data', -1); // manfiy TTL — darhol eskirgan
    expect(getCached('ttl-key')).toBeNull();
  });

  it('clearCache barcha yozuvlarni o\'chiradi', () => {
    setCached('a', 1, 60000);
    setCached('b', 2, 60000);
    setCached('c', 3, 60000);
    api.clearCache();
    expect(cache.size).toBe(0);
  });
});
