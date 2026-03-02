// api/order.js  (Vercel Serverless Function for a Vite SPA)
// Creates an order in Supabase.
//
// ENV expected on Vercel (Project Settings -> Environment Variables):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (recommended for server-side insert)
// Optional fallbacks (if you already used these names):
//   SUPABASE_ANON_KEY
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// IMPORTANT: never expose SUPABASE_SERVICE_ROLE_KEY in client code.

import { createClient } from '@supabase/supabase-js'

function pickEnv(...names) {
  for (const n of names) {
    const v = process.env[n]
    if (v && String(v).trim().length > 0) return v
  }
  return ''
}

function setCors(res) {
  // Change * to your domain if you want to lock it down
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function safeJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

async function readBody(req) {
  // Vercel sometimes parses JSON automatically, but handle raw body too
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return { raw } }
}

export default async function handler(req, res) {
  setCors(res)

  if (req.method === 'OPTIONS') return res.end()
  if (req.method !== 'POST') return safeJson(res, 405, { error: 'Method not allowed' })

  const SUPABASE_URL = pickEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')
  const SERVICE_ROLE = pickEnv('SUPABASE_SERVICE_ROLE_KEY')
  const ANON_KEY = pickEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!SUPABASE_URL) {
    return safeJson(res, 500, {
      code: 500,
      message: 'Server misconfigured: SUPABASE_URL is missing',
      hint: 'Add SUPABASE_URL in Vercel Environment Variables'
    })
  }

  // Choose key:
  // - If client sent Authorization: Bearer <jwt>, use ANON_KEY and forward the header (RLS applies).
  // - Otherwise, use SERVICE_ROLE if available (bypasses RLS; server-only).
  const authHeader = req.headers.authorization || req.headers.Authorization || ''
  const useAnonWithAuth = Boolean(authHeader && authHeader.toLowerCase().startsWith('bearer '))
  const supabaseKey = useAnonWithAuth ? ANON_KEY : (SERVICE_ROLE || ANON_KEY)

  if (!supabaseKey) {
    return safeJson(res, 500, {
      code: 500,
      message: 'Server misconfigured: no Supabase key found',
      hint: 'Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY in Vercel'
    })
  }

  try {
    const body = await readBody(req)

    // Map fields from your client (keep both old/new names)
    const from_location = body.from_location ?? body.from ?? body.fromLocation ?? body.from_address ?? null
    const to_location = body.to_location ?? body.to ?? body.toLocation ?? body.to_address ?? null
    const passenger_id = body.passenger_id ?? body.user_id ?? body.passengerId ?? null
    const price = Number(body.price ?? body.fare ?? 0) || 0
    const service_type = body.service_type ?? body.serviceType ?? body.service ?? 'taxi'

    if (!from_location || !to_location) {
      return safeJson(res, 400, {
        code: 400,
        message: 'Missing required fields',
        details: 'from_location and to_location are required'
      })
    }

    const supabase = createClient(SUPABASE_URL, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: useAnonWithAuth ? { headers: { Authorization: authHeader } } : undefined
    })



// Admin client for dispatch (needs SERVICE ROLE). If missing, order still creates but no offers are generated.
const supabaseAdmin = SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  : null

async function dispatchOrderToDrivers(orderRow) {
  if (!supabaseAdmin) return { skipped: true, reason: 'SERVICE_ROLE missing' }

  const svc = orderRow?.service_type || service_type || 'taxi'

  // Find online drivers that are active in this service.
  // NOTE: We intentionally keep this simple (no distance calc) to avoid column mismatch risks.
  const { data: drivers, error: dErr } = await supabaseAdmin
    .from('driver_presence')
    .select('driver_id,is_online,active_service_type,updated_at')
    .eq('is_online', true)
    .eq('active_service_type', svc)
    .order('updated_at', { ascending: false })
    .limit(80)

  if (dErr) return { offers: 0, error: dErr.message }

  const list = Array.isArray(drivers) ? drivers : []
  if (!list.length) return { offers: 0 }

  const rows = list.map((d) => ({
    order_id: orderRow.id,
    driver_id: d.driver_id,
    status: 'sent',
    service_type: svc
  }))

  const { error: oErr } = await supabaseAdmin.from('order_offers').insert(rows)
  if (oErr) return { offers: 0, error: oErr.message }

  return { offers: rows.length }
}

    const insertPayload = {
      passenger_id,
      from_location,
      to_location,
      price,
      status: body.status ?? 'pending',
      service_type
      // created_at: let DB default handle it if column has default now()
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      return safeJson(res, 500, {
        code: 500,
        message: error.message,
        details: error.details || null,
        hint: error.code === '42501'
          ? 'RLS blocked insert. Either send Authorization header with a logged-in user + correct RLS policy, or use SUPABASE_SERVICE_ROLE_KEY on server.'
          : null
      })
    }

        // Fire-and-forget style (await to keep deterministic response content)
    const dispatchResult = await dispatchOrderToDrivers(data)

    return safeJson(res, 200, { success: true, order: data, dispatch: dispatchResult })
  } catch (err) {
    return safeJson(res, 500, {
      code: 500,
      message: 'A server error has occurred',
      details: String(err?.message || err)
    })
  }
}
