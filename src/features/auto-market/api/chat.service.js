import * as marketApi from "../services/marketApi";

export const getChats = () => marketApi.getChats?.();
export const getMessages = (chatId) => marketApi.getMessages?.(chatId);
export const sendMessage = (chatId, payload) => marketApi.sendMessage?.(chatId, payload);
