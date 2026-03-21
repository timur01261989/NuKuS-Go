import { esClient } from "../elasticsearch.client";

export interface Place {
  id:       string;
  name:     string;
  name_ru?: string;
  address?: string;
  city:     string;
  location: { lat: number; lon: number };
  type:     "poi" | "restaurant" | "station" | "district";
}

export async function indexPlace(place: Place) {
  await esClient.index({ index: "unigo-places", id: place.id, document: place });
}

export async function searchPlaces(query: string, city?: string, lat?: number, lng?: number, limit = 10) {
  const must: any[] = [{ multi_match: { query, fields: ["name^3", "name_ru^2", "address"], fuzziness: "AUTO" } }];
  if (city) must.push({ term: { city } });

  const sort: any[] = lat && lng
    ? [{ _geo_distance: { location: { lat, lon: lng }, order: "asc", unit: "km" } }]
    : [{ _score: "desc" }];

  const res = await esClient.search({
    index: "unigo-places",
    body: { query: { bool: { must } }, sort, size: limit },
  });

  return res.hits.hits.map((h: any) => ({ id: h._id, score: h._score, ...h._source }));
}

export async function autocomplete(prefix: string, city?: string): Promise<string[]> {
  const res = await esClient.search({
    index: "unigo-places",
    body: {
      suggest: {
        place_suggest: {
          prefix,
          completion: { field: "name", size: 7 },
        },
      },
    },
  });

  const suggestions = (res as any).suggest?.place_suggest?.[0]?.options || [];
  return suggestions.map((s: any) => s.text);
}
