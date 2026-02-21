import * as marketApi from "../services/marketApi";

export const login = (payload) => marketApi.login?.(payload);
export const logout = () => marketApi.logout?.();
export const getProfile = () => marketApi.getProfile?.();
export const updateProfile = (payload) => marketApi.updateProfile?.(payload);
