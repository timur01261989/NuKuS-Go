import { esClient } from "../elasticsearch.client";

export async function indexCar(car: any) {
  await esClient.index({ index: "unigo-cars", id: car.id, document: car });
}

export async function searchCars(filters: {
  q?: string;
  brand?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  body_type?: string;
  fuel_type?: string;
}, limit = 20, offset = 0) {
  const must: any[] = [];
  const filter: any[] = [{ term: { status: "active" } }];

  if (filters.q)         must.push({ multi_match: { query: filters.q, fields: ["model^2", "description"], fuzziness: "AUTO" } });
  if (filters.brand)     filter.push({ term: { brand: filters.brand } });
  if (filters.city)      filter.push({ term: { city: filters.city } });
  if (filters.body_type) filter.push({ term: { body_type: filters.body_type } });
  if (filters.fuel_type) filter.push({ term: { fuel_type: filters.fuel_type } });
  if (filters.min_price || filters.max_price) {
    const range: any = {};
    if (filters.min_price) range.gte = filters.min_price;
    if (filters.max_price) range.lte = filters.max_price;
    filter.push({ range: { price_usd: range } });
  }
  if (filters.min_year) filter.push({ range: { year: { gte: filters.min_year } } });

  const res = await esClient.search({
    index: "unigo-cars",
    body: {
      query: { bool: { must: must.length ? must : [{ match_all: {} }], filter } },
      sort: [{ _score: "desc" }, { created_at: "desc" }],
      from: offset,
      size: limit,
    },
  });

  return {
    total: (res.hits.total as any)?.value || 0,
    items: res.hits.hits.map((h: any) => ({ id: h._id, ...h._source })),
  };
}
