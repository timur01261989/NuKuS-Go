import DataLoader from "dataloader";

const SERVICES = {
  ride:         process.env.RIDE_SERVICE_URL         || "http://ride-service:3002",
  user:         process.env.AUTH_SERVICE_URL         || "http://auth-service:3001",
  location:     process.env.LOCATION_SERVICE_URL     || "http://location-service:3005",
  ml:           process.env.ML_SERVICE_URL           || "http://ml-service:8000",
  chat:         process.env.CHAT_SERVICE_URL         || "http://chat-service:3023",
  wallet:       process.env.WALLET_SERVICE_URL       || "http://wallet-service:3024",
  earnings:     process.env.EARNINGS_SERVICE_URL     || "http://earnings-service:3025",
  safety:       process.env.SAFETY_SERVICE_URL       || "http://safety-service:3019",
  search:       process.env.SEARCH_SERVICE_URL       || "http://search-service:3014",
};

async function svcGet(base: string, path: string) {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) throw new Error(`Service error: ${res.status}`);
  return res.json();
}

async function svcPost(base: string, path: string, body: any) {
  const res = await fetch(`${base}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Service error: ${res.status}`);
  return res.json();
}

// DataLoader for N+1 prevention
function createUserLoader() {
  return new DataLoader<string, any>(async (ids) => {
    const results = await Promise.all(ids.map(id =>
      svcGet(SERVICES.user, `/auth/user/${id}`).catch(() => null)
    ));
    return results;
  });
}

function createDriverLoader() {
  return new DataLoader<string, any>(async (ids) => {
    const results = await Promise.all(ids.map(id =>
      svcGet(SERVICES.location, `/location/driver/${id}`).catch(() => null)
    ));
    return results;
  });
}

export function createResolvers() {
  const userLoader   = createUserLoader();
  const driverLoader = createDriverLoader();

  return {
    Query: {
      me: async (_: any, __: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        return svcGet(SERVICES.user, `/auth/user/${ctx.userId}`).catch(() => null);
      },

      order: async (_: any, { id }: any) =>
        svcGet(SERVICES.ride, `/ride/${id}`),

      myOrders: async (_: any, { limit = 20, offset = 0 }: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        return svcGet(SERVICES.ride, `/ride/client/${ctx.userId}?limit=${limit}&offset=${offset}`)
          .catch(() => []);
      },

      nearbyDrivers: async (_: any, { lat, lng, radius_km = 5, service_type }: any) => {
        const data = await svcGet(SERVICES.location, `/location/nearby?lat=${lat}&lng=${lng}&radius_km=${radius_km}`);
        return (data.drivers || []).slice(0, 20);
      },

      eta: async (_: any, { pickup, dropoff }: any, ctx: any) => {
        const hour = new Date().getHours();
        const day  = new Date().getDay();
        return svcPost(SERVICES.ml, "/eta/predict", {
          pickup, dropoff, hour, day_of_week: day,
        });
      },

      surgePricing: async (_: any, { lat, lng }: any) => {
        return svcPost(SERVICES.ml, "/surge/calculate", {
          lat, lng, active_drivers: 20, pending_orders: 30,
          hour: new Date().getHours(), day_of_week: new Date().getDay(),
        }).catch(() => ({ surge_factor: 1.0, zone: "normal", estimated_wait: 3, advice: "normal" }));
      },

      chatRoom: async (_: any, { order_id }: any) =>
        svcGet(SERVICES.chat, `/chat/room/${order_id}`).catch(() => null),

      myEarnings: async (_: any, __: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        return svcGet(SERVICES.earnings, `/earnings/summary/${ctx.userId}`).catch(() => null);
      },

      searchPlaces: async (_: any, { q, city, lat, lng }: any) => {
        const params = new URLSearchParams({ q, ...(city && { city }), ...(lat && { lat }), ...(lng && { lng }) });
        const data = await svcGet(SERVICES.search, `/search/places?${params}`);
        return data.results || [];
      },
    },

    Mutation: {
      createOrder: async (_: any, { input }: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        return svcPost(SERVICES.ride, "/ride/order", {
          client_id:    ctx.userId,
          service_type: input.service_type.toLowerCase(),
          pickup:       input.pickup,
          dropoff:      input.dropoff,
          stops:        input.stops,
          payment_method: input.payment_method || "cash",
          promo_code:   input.promo_code,
          scheduled_at: input.scheduled_at,
          notes:        input.notes,
        });
      },

      cancelOrder: async (_: any, { id, reason }: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        return svcPost(SERVICES.ride, `/ride/${id}/cancel`, { reason });
      },

      sendMessage: async (_: any, { room_id, content, type = "text" }: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        return svcPost(SERVICES.chat, `/chat/room/${room_id}/message`, {
          sender_id:   ctx.userId,
          sender_role: ctx.role || "client",
          content, type,
        });
      },

      topUpWallet: async (_: any, { amount, provider }: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        return svcPost(SERVICES.wallet, "/wallet/credit", {
          user_id: ctx.userId, amount, type: "topup",
          description: `${provider} orqali to'ldirish`,
        });
      },

      triggerSOS: async (_: any, { order_id, lat, lng }: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        await svcPost(SERVICES.safety, "/safety/sos", {
          order_id, user_id: ctx.userId, driver_id: null, lat, lng,
        });
        return true;
      },

      updateDriverLocation: async (_: any, { lat, lng, bearing, speed }: any, ctx: any) => {
        if (!ctx.userId) throw new Error("Unauthorized");
        await svcPost(SERVICES.location, "/location/update", {
          driver_id: ctx.userId, lat, lng, bearing, speed,
        });
        return true;
      },
    },

    Order: {
      client: (order: any) => order.client_id ? userLoader.load(order.client_id) : null,
      driver: (order: any) => order.driver_id ? driverLoader.load(order.driver_id) : null,
      chat_room: (order: any) => svcGet(SERVICES.chat, `/chat/room/${order.id}`).catch(() => null),
    },

    ChatRoom: {
      messages: (room: any, { limit = 50, before }: any) =>
        svcGet(SERVICES.chat, `/chat/room/${room.id}/messages?limit=${limit}${before ? `&before=${before}` : ""}`)
          .catch(() => []),
    },
  };
}
