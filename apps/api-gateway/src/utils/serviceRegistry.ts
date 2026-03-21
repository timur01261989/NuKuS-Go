export const serviceRegistry: Record<string, string> = {
  auth:     process.env.AUTH_SERVICE_URL     || "http://auth-service:3001",
  ride:     process.env.RIDE_SERVICE_URL     || "http://ride-service:3002",
  delivery: process.env.DELIVERY_SERVICE_URL || "http://delivery-service:3003",
  payment:  process.env.PAYMENT_SERVICE_URL  || "http://payment-service:3004",
};
export const getServiceUrl = (name: string) => {
  const url = serviceRegistry[name];
  if (!url) throw new Error(`Service "${name}" not registered`);
  return url;
};
