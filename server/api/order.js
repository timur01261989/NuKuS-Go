
// pages/api/order.js  (Next.js Pages Router)
// Orders API — fixed version

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: req.headers.authorization || ''
          }
        }
      }
    )

    const body = req.body || {}

    // Basic validation (prevents silent 500 errors)
    if (!body.from_location || !body.to_location) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'from_location or to_location is empty'
      })
    }

    const insertPayload = {
      passenger_id: body.passenger_id || null,
      from_location: body.from_location,
      to_location: body.to_location,
      price: body.price || 0,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('SUPABASE INSERT ERROR:', error)
      return res.status(500).json({
        code: 500,
        message: error.message,
        details: error.details || null
      })
    }

    return res.status(200).json({
      success: true,
      order: data
    })

  } catch (err) {
    console.error('SERVER ERROR:', err)
    return res.status(500).json({
      code: 500,
      message: 'A server error has occurred',
      details: err.message
    })
  }
}
