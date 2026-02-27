/**
 * delivery_backend_example.js (NAMUNA)
 * Bu fayl real server kodingiz emas, namunaviy mantiq.
 *
 * Endpoint: POST /api/delivery
 * body: { action: 'create' | 'status' | 'cancel' | 'update_status' | 'active', ... }
 *
 * CREATE:
 *  - secure_code = random 4-digit (1000-9999)
 *  - receiver_phone ga SMS yuborish (agar SMS servisingiz bo'lsa)
 *
 * STATUS:
 *  - id bo'yicha status/courier info qaytarish
 *
 * UPDATE_STATUS:
 *  - courier ilovasi yuboradi: pickup -> delivering -> completed
 *  - completed bo'lganda secure_code tekshiriladi (kuryer kiritgan kod)
 */

function genSecureCode() {
  return Math.floor(1000 + Math.random() * 9000);
}

async function handle(req, res, supabaseAdmin) {
  const { action } = req.body || {};

  if (action === "create") {
    const secure_code = genSecureCode();
    // payload ni jadvalga insert qiling
    // await supabaseAdmin.from("delivery_orders").insert({...})
    // SMS: receiver_phone ga secure_code yuboring
    return res.json({ ok: true, secure_code });
  }

  if (action === "status") {
    // await supabaseAdmin.from("delivery_orders").select("*").eq("id", orderId).single()
    return res.json({ ok: true });
  }

  if (action === "cancel") {
    // status='cancelled'
    return res.json({ ok: true });
  }

  if (action === "update_status") {
    // secure_code check if completed
    return res.json({ ok: true });
  }

  return res.status(400).json({ error: "Unknown action" });
}

module.exports = { handle };
