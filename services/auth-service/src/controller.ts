import { Router, Request, Response } from "express";
import { AuthService } from "./service";
export const authRouter = Router();
const svc = new AuthService();

authRouter.post("/send-otp",   async (req, res) => { try { const r = await svc.sendOtp(req.body.phone); res.json(r); } catch(e: any) { res.status(400).json({ error: e.message }); }});
authRouter.post("/verify-otp", async (req, res) => { try { const r = await svc.verifyOtp(req.body.phone, req.body.code); res.json(r); } catch(e: any) { res.status(400).json({ error: e.message }); }});
authRouter.post("/refresh",    async (req, res) => { try { const r = await svc.refreshToken(req.body.refreshToken); res.json(r); } catch(e: any) { res.status(401).json({ error: e.message }); }});
authRouter.post("/logout",     async (req, res) => { try { await svc.logout(req.body.userId); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
