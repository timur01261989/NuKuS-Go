import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("nginx config includes SSE-safe buffering directives", () => {
  const nginx = fs.readFileSync(path.join(root, "infrastructure/gateway/nginx.conf"), "utf8");
  assert.match(nginx, /proxy_buffering off/);
  assert.match(nginx, /client_max_body_size 15m/);
  assert.match(nginx, /location \/api\/event-stream/);
});

test("kubernetes api deployment includes health probes", () => {
  const manifest = fs.readFileSync(path.join(root, "infrastructure/kubernetes/api-deployment.yaml"), "utf8");
  assert.match(manifest, /readinessProbe:/);
  assert.match(manifest, /livenessProbe:/);
  assert.match(manifest, /\/api\/health/);
});

test("prometheus config scrapes worker and python-ai targets", () => {
  const prometheus = fs.readFileSync(path.join(root, "infrastructure/monitoring/prometheus.yml"), "utf8");
  assert.match(prometheus, /job_name: "unigo-worker"/);
  assert.match(prometheus, /job_name: "unigo-python-ai"/);
});
