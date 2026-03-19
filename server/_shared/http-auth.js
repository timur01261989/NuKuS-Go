export function getBearerToken(req) {
  const header = req?.headers?.authorization || req?.headers?.Authorization || "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}
