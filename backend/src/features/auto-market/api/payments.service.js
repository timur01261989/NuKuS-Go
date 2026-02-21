import * as marketApi from "../services/marketApi";

export const createPayment = (payload) => marketApi.createPayment?.(payload);
export const verifyPayment = (payload) => marketApi.verifyPayment?.(payload);
