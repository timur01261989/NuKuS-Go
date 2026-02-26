import { getUserFromRequest } from "../lib/supabase.js";

export async function requireAuth(req) {
  const { user, error } = await getUserFromRequest(req);
  if (error) {
    const e = new Error("Unauthorized");
    e.statusCode = 401;
    e.details = error.message;
    throw e;
  }
  return user;
}
