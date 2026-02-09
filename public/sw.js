/* Service Worker: cache map tiles (stale-while-revalidate) + offline fallback */ 
const VERSION = "nukusgo-sw-v1";
const TILE_CACHE = `tiles-${VERSION}`;

function isTileRequest(url) {
  return (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.hostname.includes("a.tile.openstreetmap.org") ||
    url.hostname.includes("b.tile.openstreetmap.org") ||
    url.hostname.includes("c.tile.openstreetmap.org")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method === "GET" && isTileRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(TILE_CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then((resp) => {
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      }).catch(() => null);

      if (cached) return cached;
      const net = await fetchPromise;
      if (net) return net;

      // Offline tile fallback: transparent 1x1 png
      return new Response(
        Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,11,73,68,65,84,8,215,99,0,1,0,0,5,0,1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130]),
        { headers: { "Content-Type": "image/png" } }
      );
    })());
    return;
  }
});
