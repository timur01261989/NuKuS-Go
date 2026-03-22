import { RESTDataSource } from "@apollo/datasource-rest";

const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || "http://auth-service:3001",
  ride:         process.env.RIDE_SERVICE_URL         || "http://ride-service:3002",
  location:     process.env.LOCATION_SERVICE_URL     || "http://location-service:3005",
  chat:         process.env.CHAT_SERVICE_URL         || "http://chat-service:3023",
  wallet:       process.env.WALLET_SERVICE_URL       || "http://wallet-service:3024",
  earnings:     process.env.EARNINGS_SERVICE_URL     || "http://earnings-service:3025",
  subscription: process.env.SUBSCRIPTION_SERVICE_URL || "http://subscription-service:3020",
  marketplace:  process.env.MARKETPLACE_SERVICE_URL  || "http://marketplace-service:3009",
  ml:           process.env.ML_SERVICE_URL           || "http://ml-service:8000",
};

export class AuthAPI extends RESTDataSource {
  override baseURL = SERVICES.auth + "/auth/";
  async sendOtp(phone: string)                     { return this.post("send-otp", { body: { phone } }); }
  async verifyOtp(phone: string, code: string)     { return this.post("verify-otp", { body: { phone, code } }); }
  async refreshToken(token: string)                { return this.post("refresh", { body: { refreshToken: token } }); }
  async getUser(userId: string)                    { return this.get(`user/${userId}`).catch(() => null); }
  async logout(userId: string)                     { return this.post("logout", { body: { userId } }); }
}

export class RideAPI extends RESTDataSource {
  override baseURL = SERVICES.ride + "/ride/";
  async createOrder(data: any)                     { return this.post("order", { body: data }); }
  async getOrder(id: string)                       { return this.get(`order/${id}`); }
  async getUserOrders(userId: string, limit: number, offset: number) { return this.get(`orders/${userId}?limit=${limit}&offset=${offset}`).catch(() => []); }
  async getActiveOrder(userId: string)             { return this.get(`active/${userId}`).catch(() => null); }
  async cancelOrder(id: string, reason?: string)   { return this.patch(`${id}`, { body: { status: "cancelled", reason } }); }
  async acceptOrder(id: string, driverId: string)  { return this.patch(`${id}`, { body: { status: "accepted", driver_id: driverId } }); }
  async completeOrder(id: string, driverId: string){ return this.patch(`${id}`, { body: { status: "completed", driver_id: driverId } }); }
  async rateDriver(orderId: string, userId: string, rating: number, comment?: string) { return this.post(`rate`, { body: { order_id: orderId, user_id: userId, rating, comment } }); }
}

export class LocationAPI extends RESTDataSource {
  override baseURL = SERVICES.location + "/location/";
  async getNearbyDrivers(lat: number, lng: number, radius: number, service: string) { return this.get(`nearby?lat=${lat}&lng=${lng}&radius_km=${radius}&service_type=${service}`).then((r: any) => r.drivers || []); }
  async getDriver(id: string)                      { return this.get(`driver/${id}`); }
  async getDriverLocation(id: string)              { return this.get(`driver/${id}`).catch(() => null); }
  async updateLocation(dId: string, lat: number, lng: number, bearing?: number, speed?: number) { return this.post("update", { body: { driver_id: dId, lat, lng, bearing, speed } }); }
  async setDriverStatus(dId: string, status: string) { return this.post("status", { body: { driver_id: dId, status } }).catch(() => ({ status })); }
}

export class ChatAPI extends RESTDataSource {
  override baseURL = SERVICES.chat + "/chat/";
  async getMessages(roomId: string, limit: number) { return this.get(`room/${roomId}/messages?limit=${limit}`).catch(() => []); }
  async sendMessage(roomId: string, senderId: string, role: string, content: string, type: string) { return this.post(`room/${roomId}/message`, { body: { sender_id: senderId, sender_role: role, content, type } }); }
  async markRead(roomId: string, role: string)     { return this.post(`room/${roomId}/read`, { body: { role } }); }
}

export class WalletAPI extends RESTDataSource {
  override baseURL = SERVICES.wallet + "/wallet/";
  async getWallet(userId: string)                  { return this.get(userId).catch(() => null); }
  async topUp(userId: string, amount: number, provider: string) { return this.post("credit", { body: { user_id: userId, amount, type: "topup", description: `${provider} orqali to'lash` } }); }
}

export class EarningsAPI extends RESTDataSource {
  override baseURL = SERVICES.earnings + "/earnings/";
  async getSummary(driverId: string)               { return this.get(`summary/${driverId}`).catch(() => null); }
}

export class SubscriptionAPI extends RESTDataSource {
  override baseURL = SERVICES.subscription + "/subscription/";
  async getUserSubscription(userId: string)        { return this.get(`user/${userId}`).catch(() => null); }
  async subscribe(userId: string, planId: string, billing: string) { return this.post("subscribe", { body: { user_id: userId, plan_id: planId, billing } }); }
}

export class MarketplaceAPI extends RESTDataSource {
  override baseURL = SERVICES.marketplace + "/marketplace/";
  async listAds(filters: any, limit: number, offset: number) {
    const q = new URLSearchParams({ ...filters, limit: String(limit), offset: String(offset) }).toString();
    return this.get(`ads?${q}`);
  }
  async getAd(id: string)                          { return this.get(`ad/${id}`); }
  async createAd(data: any)                        { return this.post("ad", { body: data }); }
  async deleteAd(id: string, sellerId: string)     { return this.delete(`ad/${id}`, { body: { seller_id: sellerId } }); }
}

export class MLAPI extends RESTDataSource {
  override baseURL = SERVICES.ml + "/";
  async getETA(args: any) {
    return this.post("eta/predict", { body: {
      pickup: { lat: args.pickup_lat, lng: args.pickup_lng },
      dropoff: { lat: args.dropoff_lat, lng: args.dropoff_lng },
      hour: new Date().getHours(), day_of_week: new Date().getDay(),
    }});
  }
  async getSurge(lat: number, lng: number) {
    return this.post("surge/calculate", { body: { lat, lng, active_drivers: 10, pending_orders: 15, hour: new Date().getHours(), day_of_week: new Date().getDay() } });
  }
}
