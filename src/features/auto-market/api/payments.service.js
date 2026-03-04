import * as marketApi from "../services/marketBackend";

export const createPayment = (payload) => marketApi.createPayment?.(payload);
export const verifyPayment = (payload) => marketApi.verifyPayment?.(payload);
