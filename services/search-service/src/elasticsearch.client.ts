import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://elasticsearch:9200",
  auth: process.env.ELASTIC_PASSWORD
    ? { username: "elastic", password: process.env.ELASTIC_PASSWORD }
    : undefined,
  maxRetries: 3,
  requestTimeout: 10000,
});

export async function initIndices() {
  const indices = [
    {
      index: "unigo-places",
      body: {
        mappings: {
          properties: {
            name:     { type: "text", analyzer: "standard" },
            name_ru:  { type: "text", analyzer: "russian" },
            address:  { type: "text" },
            city:     { type: "keyword" },
            location: { type: "geo_point" },
            type:     { type: "keyword" },
          },
        },
      },
    },
    {
      index: "unigo-cars",
      body: {
        mappings: {
          properties: {
            brand:        { type: "keyword" },
            model:        { type: "text" },
            year:         { type: "integer" },
            price_usd:    { type: "integer" },
            city:         { type: "keyword" },
            description:  { type: "text" },
            fuel_type:    { type: "keyword" },
            body_type:    { type: "keyword" },
          },
        },
      },
    },
    {
      index: "unigo-restaurants",
      body: {
        mappings: {
          properties: {
            name:          { type: "text" },
            category:      { type: "keyword" },
            city:          { type: "keyword" },
            location:      { type: "geo_point" },
            is_open:       { type: "boolean" },
            rating:        { type: "float" },
          },
        },
      },
    },
  ];

  for (const { index, body } of indices) {
    const exists = await esClient.indices.exists({ index });
    if (!exists) {
      await esClient.indices.create({ index, body } as any);
      console.warn(`[search] Created index: ${index}`);
    }
  }
}
