import { loadConfig } from '../shared/config/configService.js';

const DEFAULT_REMOTE = {
  market: { enabled: true, post: { image_quality: 75, max_images: 10, require_phone: true }, ui: { preview_count: 6 } }
};
const DEFAULT_PARAMS = { brands: [], modelsByBrand: {}, fuel: [], gearbox: [], cities: [] };
const DEFAULT_TILES = { tiles: [] };

export async function getMarketRemoteConfig() {
  return await loadConfig('market_remote_config', DEFAULT_REMOTE);
}

export async function getMarketParams() {
  return await loadConfig('market_params', DEFAULT_PARAMS);
}

export async function getMarketTiles() {
  return await loadConfig('market_tiles', DEFAULT_TILES);
}
