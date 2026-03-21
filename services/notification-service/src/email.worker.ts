/**
 * Email Worker — Transactional emails via SMTP / SendGrid
 * Used for: receipts, password reset, weekly reports, promo
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

const FROM = process.env.EMAIL_FROM || "noreply@unigo.uz";
const SENDGRID_KEY = process.env.SENDGRID_API_KEY || "";

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!SENDGRID_KEY) {
    console.warn(`[email] No API key — skipping email to ${payload.to}`);
    return false;
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: payload.to }] }],
        from: { email: payload.from || FROM, name: "UniGo" },
        subject: payload.subject,
        content: [
          { type: "text/html",  value: payload.html },
          ...(payload.text ? [{ type: "text/plain", value: payload.text }] : []),
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (e) {
    console.error("[email] send failed:", (e as Error).message);
    return false;
  }
}

export function buildReceiptEmail(order: {
  id: string; service: string; price_uzs: number; pickup: string; dropoff: string;
}): EmailPayload {
  return {
    to: "",
    subject: `UniGo — Buyurtma #${order.id.slice(0, 8).toUpperCase()} tasdiqlandi`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#F46A0A">UniGo — Chek</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td>Xizmat</td><td><b>${order.service}</b></td></tr>
          <tr><td>Narx</td><td><b>${order.price_uzs.toLocaleString("ru-RU")} so'm</b></td></tr>
          <tr><td>Ketish</td><td>${order.pickup}</td></tr>
          <tr><td>Borish</td><td>${order.dropoff}</td></tr>
        </table>
        <p style="color:#888;font-size:12px">UniGo SuperApp — O'zbekiston</p>
      </div>
    `,
  };
}
