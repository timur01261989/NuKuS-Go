// FCM Push Notification Worker
const FCM_KEY = process.env.FCM_SERVER_KEY || "";

export async function sendPush(token: string, title: string, body: string, data?: object) {
  if (!FCM_KEY || !token) return;
  const payload = {
    to: token,
    notification: { title, body, sound: "default" },
    data: data || {},
  };
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: { "Authorization": `key=${FCM_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`FCM error: ${JSON.stringify(json)}`);
  return json;
}
