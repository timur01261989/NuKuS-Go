// Optional env validator (not wired by default)
export function requireEnv(name) {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}
