const counters: Record<string, number> = {};
export function roundRobin(instances: string[]): string {
  if (!instances.length) throw new Error("No instances");
  const key = instances.join(",");
  counters[key] = ((counters[key] || 0) + 1) % instances.length;
  return instances[counters[key]];
}
