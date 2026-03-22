import jwt from "jsonwebtoken";
import {
  AuthAPI, RideAPI, LocationAPI, ChatAPI,
  WalletAPI, EarningsAPI, SubscriptionAPI, MarketplaceAPI, MLAPI
} from "./dataSources/ServiceAPI";

export interface AuthUser { sub: string; phone: string; role: string; }

export interface Context {
  user: AuthUser | null;
  dataSources: {
    authAPI:          AuthAPI;
    rideAPI:          RideAPI;
    locationAPI:      LocationAPI;
    chatAPI:          ChatAPI;
    walletAPI:        WalletAPI;
    earningsAPI:      EarningsAPI;
    subscriptionAPI:  SubscriptionAPI;
    marketplaceAPI:   MarketplaceAPI;
    mlAPI:            MLAPI;
  };
}

export function createContext({ req }: { req: any }): Omit<Context, "dataSources"> {
  const token  = req?.headers?.authorization?.replace("Bearer ", "");
  let user: AuthUser | null = null;
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as AuthUser;
    } catch {}
  }
  return { user };
}
