import { DeliveryRepository } from "./delivery.repository";
import { DeliveryOrder } from "./delivery.types";

const repo = new DeliveryRepository();

export class DeliveryService {
  async createOrder(data: any): Promise<DeliveryOrder> {
    if (!data.pickup?.lat || !data.dropoff?.lat) throw new Error("Pickup and dropoff required");
    if (!data.user_id) throw new Error("user_id required");
    return repo.create(data);
  }

  async getOrder(id: string) {
    const order = await repo.findById(id);
    if (!order) throw new Error("Order not found");
    return order;
  }

  async myActiveOrders(userId: string) {
    return repo.findActiveByUser(userId);
  }

  async accept(orderId: string, driverId: string) {
    return repo.updateStatus(orderId, "accepted", driverId);
  }

  async pickup(orderId: string) {
    return repo.updateStatus(orderId, "picked_up");
  }

  async complete(orderId: string) {
    return repo.updateStatus(orderId, "delivered");
  }

  async cancel(orderId: string, reason?: string) {
    return repo.cancel(orderId, reason);
  }
}
