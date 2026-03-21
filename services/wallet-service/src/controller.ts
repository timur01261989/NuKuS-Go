import { Router } from "express";
import { WalletService } from "./wallet.service";

export const walletRouter = Router();
const svc = new WalletService();

walletRouter.get("/:userId",              async (req, res) => { try { res.json(await svc.getWallet(req.params.userId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
walletRouter.get("/:userId/transactions", async (req, res) => { try { res.json(await svc.getTransactions(req.params.userId, Number(req.query.limit)||30, Number(req.query.offset)||0)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
walletRouter.get("/:userId/stats",        async (req, res) => { try { res.json(await svc.getStats(req.params.userId)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
walletRouter.post("/credit",              async (req, res) => { try { const { user_id, amount, type, description, order_id, reference } = req.body; res.json(await svc.credit(user_id, amount, type, description, order_id, reference)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
walletRouter.post("/debit",               async (req, res) => { try { const { user_id, amount, type, description, order_id } = req.body; res.json(await svc.debit(user_id, amount, type, description, order_id)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
walletRouter.post("/lock",                async (req, res) => { try { await svc.lock(req.body.user_id, req.body.amount, req.body.order_id); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
walletRouter.post("/unlock",              async (req, res) => { try { await svc.unlock(req.body.user_id, req.body.amount, req.body.order_id, req.body.charge ?? true); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
walletRouter.post("/transfer",            async (req, res) => { try { await svc.transfer(req.body.from_id, req.body.to_id, req.body.amount, req.body.description); res.json({ ok: true }); } catch(e: any) { res.status(400).json({ error: e.message }); }});
