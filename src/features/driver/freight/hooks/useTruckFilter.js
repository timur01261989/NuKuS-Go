import { useMemo } from "react";

/**
 * Haydovchi mashinasiga mos buyurtmalarni ajratish.
 * Bu yerda qoidalar oddiy: order.required_kind va required_tons bo'lsa moslashtiramiz.
 */
export function useTruckFilter(orders, vehicle, mode) {
  return useMemo(() => {
    if (!Array.isArray(orders)) return [];
    if (!vehicle) return orders;

    const kind = vehicle.kind; // 'small' | 'medium' | 'heavy' | 'bulk'
    const cap = Number(vehicle.capacityTons || 0);

    return orders.filter((o) => {
      if (mode && o.mode && o.mode !== mode) return false;
      if (o.required_kind && o.required_kind !== kind) return false;
      if (o.required_tons && cap && Number(o.required_tons) > cap) return false;
      return true;
    });
  }, [orders, vehicle, mode]);
}
