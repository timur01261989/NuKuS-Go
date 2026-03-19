import { json } from '../_shared/cors.js';

export default async function handler(req, res) {
  return json(res, 200, { ok:true, ts: new Date().toISOString() });
}