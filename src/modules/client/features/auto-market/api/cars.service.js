import * as marketApi from "../services/marketBackend";

/**
 * Cars / Ads service (proxy layer)
 * Keeps old behavior intact while enabling clean imports.
 */
export const getCarList = (params) => marketApi.getCarList(params);
export const getCarDetails = (id) => marketApi.getCarDetails(id);
export const createCarAd = (payload) => marketApi.createCarAd(payload);
export const updateCarAd = (id, payload) => marketApi.updateCarAd?.(id, payload);
export const deleteCarAd = (id) => marketApi.deleteCarAd?.(id);

export const toggleFavorite = (id) => marketApi.toggleFavorite?.(id);
export const getFavorites = () => marketApi.getFavorites?.();

/**
 * Smart pricing hook point (optional in old api)
 */
export const predictPrice = (params) => marketApi.predictPrice?.(params);
