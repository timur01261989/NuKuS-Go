import { withAuth } from "../_shared/withAuth.js";

async function handler(req, res) {
  res.status(200).json({
    location_cache: "redis_memory",
    geo_search: "redis_geo",
    matching: "memory_dispatch",
    wave_dispatch: [3, 3, 5],
    websocket_mode: "targeted_not_broadcast",
  });
}

export default withAuth(handler);
