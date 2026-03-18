# UniGo — Endpoint Contract Jadvali

> DOCX Section 8 tavsiyasi: Push/auth/notification endpointlari uchun kontrakt jadvallari yozing.

---

## Push Endpoints

### `POST /api/push/register` (asosiy) · `POST /api/push` (eski, deprecated)

**Maqsad:** FCM token ni serverga saqlash/yangilash.

**Auth:** Bearer token (Supabase JWT)

**Request body:**
```json
{
  "role":        "client | driver | admin",   // majburiy
  "fcm_token":   "string",                    // majburiy
  "device_id":   "string | null",             // ixtiyoriy
  "platform":    "android | ios | web | null",// ixtiyoriy
  "app_version": "string | null"              // ixtiyoriy
}
```

**Response 200:**
```json
{ "ok": true, "token": { "user_id": "...", "role": "...", "fcm_token": "..." } }
```

**Xatolar:** 400 user_id/role/fcm_token yo'q | 401 autentifikatsiya | 500 server

**Conflict key:** `user_id, role, device_id` — upsert

---

### `POST /api/push/send` · `POST /api/push_send`

**Maqsad:** Foydalanuvchiga FCM push yuborish.

**Auth:** Service-role yoki admin JWT

**Request body:**
```json
{
  "target_user_id": "uuid",     // yoki user_id
  "role":           "client | driver | admin",
  "title":          "string",
  "body":           "string",
  "data":           {}           // ixtiyoriy
}
```

**Response 200:**
```json
{ "ok": true, "result": { ... } }
```

**Env:** `FCM_SERVER_KEY` majburiy

---

## Auth Endpoints

### `POST /api/auth`

**Actions:** `login`, `otp_send`, `otp_verify`, `logout`, `refresh`, `me`

**Auth:** action=login → yo'q; boshqalar → Bearer token

**Request body:**
```json
{ "action": "login", "phone": "+998XXXXXXXXX", "password": "string" }
{ "action": "otp_send", "phone": "+998XXXXXXXXX", "purpose": "signup | reset" }
{ "action": "otp_verify", "phone": "+998XXXXXXXXX", "otp": "123456", "purpose": "..." }
{ "action": "me" }
```

**Response 200:**
```json
{ "ok": true, "user": { "id": "...", "role": "..." }, "session": { ... } }
```

---

## Notifications Endpoints

### `GET /api/notifications`

**Auth:** Bearer token

**Query:** `?limit=20&offset=0&unread_only=false`

**Response 200:**
```json
{ "ok": true, "items": [ { "id": "...", "title": "...", "read": false, "created_at": "..." } ] }
```

### `POST /api/notifications`

**Actions:** `mark_read`, `mark_all_read`, `delete`

**Request body:**
```json
{ "action": "mark_read",     "id": "uuid" }
{ "action": "mark_all_read" }
{ "action": "delete",        "id": "uuid" }
```

---

## SOS Endpoints

### `POST /api/sos`

**Actions:** `trigger`, `resolve`, `status`

**Auth:** Bearer token (majburiy)

**Request body:**
```json
{
  "action":   "trigger",
  "order_id": "uuid | null",
  "lat":      37.9,
  "lon":      67.5,
  "message":  "string | null"
}
```

**Response 200:**
```json
{ "ok": true, "sos_id": "...", "dispatched": true }
```

**Rate limit:** 1 ta aktiv SOS / foydalanuvchi

**Idempotency:** `X-Idempotency-Key` header qo'llab-quvvatlanadi

---

## Rate Limit Qoidalari

| Endpoint          | Limit          | Oyna    |
|-------------------|----------------|---------|
| /api/auth         | 10 req         | 1 min   |
| /api/push/register| 20 req         | 1 min   |
| /api/push/send    | 100 req        | 1 min   |
| /api/sos          | 5 req          | 5 min   |
| /api/notifications| 60 req         | 1 min   |

---

## Idempotency

`POST /api/order`, `POST /api/payments`, `POST /api/push/register` — `X-Idempotency-Key: <uuid>` headerini qabul qiladi. Bir xil key bilan ikkinchi so'rov saqlanmay, kesh javob qaytaradi.

---

## Ownership Jadvali

| Endpoint qatlami     | Egasi          | Fayl                          |
|----------------------|----------------|-------------------------------|
| push/register        | Backend        | server/api/push_register.js   |
| push/send            | Backend        | server/api/push_send.js       |
| auth                 | Backend        | server/api/auth.js            |
| notifications        | Backend        | server/api/notifications.js   |
| sos                  | Backend        | server/api/sos.js             |
| order                | Backend        | server/api/order.js           |
| payments             | Backend        | server/api/payments.js        |

