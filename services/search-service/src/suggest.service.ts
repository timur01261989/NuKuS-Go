import { esClient } from "./elasticsearch.client";

export async function suggest(query: string, type: "places" | "cars" | "restaurants" = "places") {
  const indexMap = { places: "unigo-places", cars: "unigo-cars", restaurants: "unigo-restaurants" };
  const index = indexMap[type];

  const res = await esClient.search({
    index,
    body: {
      query: {
        multi_match: {
          query,
          fields: type === "cars" ? ["brand^2", "model"] : ["name^2", "address"],
          type: "phrase_prefix",
        },
      },
      size: 5,
      _source: type === "cars" ? ["brand", "model", "year", "price_usd"] : ["name", "address", "city"],
    },
  });

  return res.hits.hits.map((h: any) => ({ id: h._id, ...h._source }));
}
