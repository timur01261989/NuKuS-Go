import express from "express";
import cors from "cors";
import { sendPush } from "./push.worker";
import { sendSms }  from "./sms.worker";
import { sendEmail } from "./email.worker";
import { sendInApp, markRead, getUnread } from "./inApp.worker";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/notify/push",    async (req, res) => { try { await sendPush(req.body.token, req.body.title, req.body.body, req.body.data); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
app.post("/notify/sms",     async (req, res) => { try { await sendSms(req.body.phone, req.body.message); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
app.post("/notify/email",   async (req, res) => { try { await sendEmail(req.body.to, req.body.subject, req.body.html); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});
app.post("/notify/in-app",  async (req, res) => { try { res.json(await sendInApp(req.body)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
app.get("/notify/unread/:userId", async (req, res) => { try { res.json(await getUnread(req.params.userId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
app.patch("/notify/read/:id",     async (req, res) => { try { await markRead(req.body.user_id, req.params.id); res.json({ ok: true }); } catch(e: any) { res.status(500).json({ error: e.message }); }});

app.get("/health", (_, res) => res.json({ service: "notification", status: "ok" }));

const PORT = Number(process.env.PORT) || 3006;
app.listen(PORT, () => console.warn(`[notification-service] :${PORT}`));
