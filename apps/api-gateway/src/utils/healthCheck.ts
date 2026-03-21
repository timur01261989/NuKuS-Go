import { serviceRegistry } from "./serviceRegistry";

export interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number;
  checked_at: string;
}

export async function checkService(name: string, url: string): Promise<HealthStatus> {
  const start = Date.now();
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
    const latency_ms = Date.now() - start;
    return {
      service: name,
      status: res.ok ? "healthy" : "degraded",
      latency_ms,
      checked_at: new Date().toISOString(),
    };
  } catch {
    return {
      service: name,
      status: "down",
      latency_ms: Date.now() - start,
      checked_at: new Date().toISOString(),
    };
  }
}

export async function checkAllServices(): Promise<HealthStatus[]> {
  return Promise.all(
    Object.entries(serviceRegistry).map(([name, url]) => checkService(name, url))
  );
}
