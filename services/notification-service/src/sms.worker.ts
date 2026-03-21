// SMS Worker (Eskiz.uz integration)
export async function sendSms(phone: string, message: string) {
  const token = await getEskizToken();
  const res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_phone: phone, message, from: "4546" }),
  });
  return res.json();
}

async function getEskizToken() {
  const res = await fetch("https://notify.eskiz.uz/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.ESKIZ_EMAIL, password: process.env.ESKIZ_PASSWORD }),
  });
  const json = await res.json();
  return json.data?.token;
}
