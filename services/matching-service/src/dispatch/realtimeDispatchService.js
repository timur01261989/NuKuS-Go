function safeSend(client, payload) {
  try {
    client.send(JSON.stringify(payload));
  } catch (error) {
    // no-op
  }
}

export function pushDispatchEvent(wsServer, payload) {
  if (!wsServer || !payload) return 0;

  const targetDriverIds = Array.isArray(payload.driver_ids)
    ? payload.driver_ids.map(String)
    : payload.driver_id
      ? [String(payload.driver_id)]
      : [];

  let delivered = 0;

  wsServer.clients.forEach((client) => {
    const clientDriverId = String(client.driverId || client.userId || "");
    if (targetDriverIds.length && !targetDriverIds.includes(clientDriverId)) {
      return;
    }

    safeSend(client, {
      type: "dispatch_offer",
      data: payload,
    });
    delivered += 1;
  });

  return delivered;
}
