import * as marketApi from "../services/marketBackend";

export const getChats = () => marketApi.getChats?.();
export const getMessages = (chatId) => marketApi.getMessages?.(chatId);
export const sendMessage = (chatId, payload) => marketApi.sendMessage?.(chatId, payload);
