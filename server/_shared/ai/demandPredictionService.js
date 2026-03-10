export function predictDemand(areaData = {}) {
  const orders = Number(areaData.orders || 0);
  const drivers = Number(areaData.drivers || 0);

  if (drivers <= 0) {
    return 3;
  }

  const ratio = orders / drivers;
  if (ratio > 5) return 3;
  if (ratio > 3) return 2;
  if (ratio > 2) return 1.5;
  return 1;
}

export function buildDemandSnapshot({ activeOrders = 0, onlineDrivers = 0 } = {}) {
  const multiplier = predictDemand({ orders: activeOrders, drivers: onlineDrivers });
  return {
    active_orders: Number(activeOrders || 0),
    online_drivers: Number(onlineDrivers || 0),
    multiplier,
    surge_active: multiplier > 1,
  };
}
