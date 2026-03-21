import { FreightRepository } from "./freight.repository";

const repo = new FreightRepository();

export class FreightService {
  async createCargo(data: any) {
    if (!data.pickup?.lat || !data.dropoff?.lat) throw new Error("Pickup/dropoff required");
    if (!data.user_id) throw new Error("user_id required");
    return repo.create(data);
  }
  async getCargo(id: string) {
    const c = await repo.findById(id);
    if (!c) throw new Error("Cargo not found");
    return c;
  }
  async myOrders(userId: string) { return repo.listByUser(userId); }
  async matchVehicles(cargoId: string, radiusKm?: number) { return repo.matchVehicles(cargoId, radiusKm); }
  async accept(cargoId: string, driverId: string) { return repo.updateStatus(cargoId, "accepted", driverId); }
  async startTransit(cargoId: string) { return repo.updateStatus(cargoId, "in_transit"); }
  async complete(cargoId: string) { return repo.updateStatus(cargoId, "completed"); }
  async cancel(cargoId: string) { return repo.updateStatus(cargoId, "canceled"); }
}
