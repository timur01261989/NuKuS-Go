/**
 * gRPC Client Factory
 * Usage:
 *   const rideClient = createGrpcClient('ride');
 *   const order = await rideClient.createOrder({ ... });
 */

// In production: install @grpc/grpc-js and @grpc/proto-loader
// npm install @grpc/grpc-js @grpc/proto-loader

const GRPC_URLS: Record<string, string> = {
  ride:     process.env.RIDE_SERVICE_GRPC_URL     || "ride-service:50001",
  location: process.env.LOCATION_SERVICE_GRPC_URL || "location-service:50002",
  matching: process.env.MATCHING_SERVICE_GRPC_URL || "matching-service:50003",
  payment:  process.env.PAYMENT_SERVICE_GRPC_URL  || "payment-service:50004",
  auth:     process.env.AUTH_SERVICE_GRPC_URL     || "auth-service:50005",
};

// HTTP/2 transport config for max performance
export const GRPC_OPTIONS = {
  "grpc.keepalive_time_ms":                  10_000,
  "grpc.keepalive_timeout_ms":               5_000,
  "grpc.keepalive_permit_without_calls":     1,
  "grpc.http2.max_pings_without_data":       0,
  "grpc.http2.min_time_between_pings_ms":    10_000,
  "grpc.max_receive_message_length":         -1,
  "grpc.max_send_message_length":            -1,
};

/**
 * HTTP/JSON → gRPC adapter for development/fallback
 * Allows existing HTTP services to be called via gRPC interface
 */
export async function grpcFallbackHttp(
  serviceUrl:  string,
  methodPath:  string,
  payload:     object
): Promise<any> {
  const httpUrl = serviceUrl.replace(/:\d+$/, "");
  const port    = parseInt(serviceUrl.split(":")[1] || "3002") - 10000 + 3000;
  try {
    const res = await fetch(`http://${httpUrl}:${port}${methodPath}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(5000),
    });
    return res.json();
  } catch (e: any) {
    throw new Error(`gRPC fallback failed: ${e.message}`);
  }
}

export function getGrpcUrl(service: string): string {
  return GRPC_URLS[service] || `${service}:50000`;
}
