import { NodeSDK }              from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter }  from "@opentelemetry/exporter-trace-otlp-http";
import { Resource }           from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { trace, context, propagation, SpanStatusCode } from "@opentelemetry/api";

let sdk: NodeSDK | null = null;

export function initTracing(serviceName: string): void {
  const exporter = new OTLPTraceExporter({
    url: `${process.env.JAEGER_URL || "http://jaeger:4318"}/v1/traces`,
  });

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]:    serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || "8.0.0",
      "deployment.environment": process.env.NODE_ENV || "development",
    }),
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-http":  { enabled: true },
        "@opentelemetry/instrumentation-express":{ enabled: true },
        "@opentelemetry/instrumentation-pg":    { enabled: true },
        "@opentelemetry/instrumentation-redis": { enabled: true },
      }),
    ],
  });

  sdk.start();
  process.on("SIGTERM", async () => { await sdk?.shutdown(); });
  console.warn(`[tracing] OpenTelemetry initialized for ${serviceName}`);
}

export async function withSpan<T>(
  name:      string,
  attrs:     Record<string, any>,
  fn:        () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer("unigo");
  return tracer.startActiveSpan(name, async (span) => {
    try {
      Object.entries(attrs).forEach(([k, v]) => span.setAttribute(k, v));
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}

export function getTraceId(): string {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId || "no-trace";
}
