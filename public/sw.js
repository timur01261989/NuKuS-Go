/* Service Worker: cache map tiles (stale-while-revalidate) + offline fallback + Push Notifications */
const VERSION = "nukusgo-sw-v3";
const TILE_CACHE = `tiles-${VERSION}`;

/**
 * Tile so'rovlarini aniqlash
 * OSM va CartoDB tile'lari keshlanadi (ilova ikkalasini ishlatadi)
 */
function isTileRequest(url) {
  return (
    url.hostname.includes("tile.openstreetmap.org") ||
    url.hostname.includes("a.tile.openstreetmap.org") ||
    url.hostname.includes("b.tile.openstreetmap.org") ||
    url.hostname.includes("c.tile.openstreetmap.org") ||
    url.hostname.includes("basemaps.cartocdn.com") ||
    url.hostname.includes("cartodb-basemaps-a.global.ssl.fastly.net") ||
    url.hostname.includes("cartodb-basemaps-b.global.ssl.fastly.net") ||
    url.hostname.includes("cartodb-basemaps-c.global.ssl.fastly.net") ||
    url.hostname.includes("cartodb-basemaps-d.global.ssl.fastly.net")
  );
}

/* ===== FETCH — tile caching (stale-while-revalidate) ===== */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method === "GET" && isTileRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILE_CACHE);
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((resp) => {
            if (resp && resp.ok) cache.put(req, resp.clone());
            return resp;
          })
          .catch(() => null);

        // Stale-while-revalidate: darhol keshdan, orqada yangilash
        if (cached) return cached;
        const net = await fetchPromise;
        if (net) return net;

        // Offline tile fallback: transparent 1x1 png
        return new Response(
          Uint8Array.from([
            137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,
            8,6,0,0,0,31,21,196,137,0,0,0,11,73,68,65,84,8,215,99,0,1,0,0,
            5,0,1,13,10,45,180,0,0,0,0,73,69,78,68,174,66,96,130,
          ]),
          { headers: { "Content-Type": "image/png" } }
        );
      })()
    );
    return;
  }
});

/* ===== ACTIVATE — eski cache versiyalarini tozalash ===== */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("tiles-") && k !== TILE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ===== PUSH NOTIFICATIONS ===== */
self.addEventListener("push", (event) => {
  try {
    const data = event.data ? event.data.json() : {};

    const title = data.title || "Nukus Go";
    const body = data.body || "";
    const icon = data.icon || "/icons/icon-192.png";
    const badge = data.badge || "/icons/badge-72.png";
    const url = data.url || "/";
    const actions = data.actions || [];
    const vibrate = data.vibrate || [200, 100, 200];
    const tag = data.tag || "nukusgo-push";

    const options = {
      body,
      icon,
      badge,
      vibrate,
      tag,
      data: { url },
      actions,
      requireInteraction: data.requireInteraction || false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Push data noto'g'ri bo'lsa ham SW buzilmasin
    event.waitUntil(
      self.registration.showNotification("Nukus Go", { body: "Yangi xabar" })
    );
  }
});

/* ===== NOTIFICATION CLICK ===== */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  // Haydovchi: buyurtmani qabul qilish
  if (event.action === "accept") {
    const acceptUrl = event.notification.data?.acceptUrl || "/driver/dashboard";
    event.waitUntil(clients.openWindow(acceptUrl));
    return;
  }

  // Haydovchi: rad etish — hech narsa qilmaymiz
  if (event.action === "decline") {
    return;
  }

  // Odatdagi bosish — ilovani ochish yoki focus qilish
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      })
  );
});

/* ===== NOTIFICATION CLOSE ===== */
self.addEventListener("notificationclose", () => {
  // Statistika uchun (ixtiyoriy)
});

/* ===== MESSAGE — SW yangilash ===== */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
