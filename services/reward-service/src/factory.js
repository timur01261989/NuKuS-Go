import { createRewardService } from './service.js';

const serviceCache = new WeakMap();

export function getRewardService(sb, options = {}) {
  if (!sb) throw new Error('Supabase client is required');
  if (serviceCache.has(sb)) {
    return serviceCache.get(sb);
  }
  const service = createRewardService(sb, options);
  serviceCache.set(sb, service);
  return service;
}
