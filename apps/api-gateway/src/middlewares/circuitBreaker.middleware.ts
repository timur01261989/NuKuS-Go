import { Request, Response, NextFunction } from "express";

interface CircuitState { failures: number; lastFailure: number; state: "closed" | "open" | "half-open"; }

const circuits = new Map<string, CircuitState>();
const THRESHOLD = 5;       // 5 failures → open
const TIMEOUT   = 30_000;  // 30s cool-down
const HALF_OPEN_CALLS = 3; // test calls in half-open

function getCircuit(service: string): CircuitState {
  if (!circuits.has(service)) circuits.set(service, { failures: 0, lastFailure: 0, state: "closed" });
  return circuits.get(service)!;
}

export function circuitBreakerMiddleware(service: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const circuit = getCircuit(service);
    const now = Date.now();

    if (circuit.state === "open") {
      if (now - circuit.lastFailure > TIMEOUT) {
        circuit.state = "half-open";
        circuit.failures = 0;
      } else {
        return res.status(503).json({
          error: "Service temporarily unavailable",
          service,
          retry_after: Math.ceil((TIMEOUT - (now - circuit.lastFailure)) / 1000),
        });
      }
    }

    // Intercept response to track failures
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 500) {
        circuit.failures++;
        circuit.lastFailure = Date.now();
        if (circuit.failures >= THRESHOLD) circuit.state = "open";
      } else if (circuit.state === "half-open") {
        circuit.state = "closed";
        circuit.failures = 0;
      }
      return originalJson(body);
    };

    next();
  };
}
