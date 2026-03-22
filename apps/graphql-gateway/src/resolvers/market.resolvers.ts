import { Context } from "../context";

export const marketResolvers = {
  Query: {
    carAds: async (_: any, { brand, city, min_price, max_price, limit = 20, offset = 0 }: any, { dataSources }: Context) => {
      return dataSources.marketplaceAPI.listAds({ brand, city, min_price, max_price }, limit, offset);
    },
    carAd: async (_: any, { id }: any, { dataSources }: Context) => {
      return dataSources.marketplaceAPI.getAd(id);
    },
  },
  Mutation: {
    createCarAd: async (_: any, { input }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      return dataSources.marketplaceAPI.createAd({ ...input, seller_id: user.sub });
    },
    deleteCarAd: async (_: any, { id }: any, { user, dataSources }: Context) => {
      if (!user) throw new Error("AUTH_REQUIRED");
      await dataSources.marketplaceAPI.deleteAd(id, user.sub);
      return true;
    },
  },
};
