import { Router } from "express";
import { CorporateService } from "./corporate.service";

export const corporateRouter = Router();
const svc = new CorporateService();

corporateRouter.post("/company",                async (req, res) => { try { res.json(await svc.createCompany(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
corporateRouter.get("/company/:id",             async (req, res) => { try { res.json(await svc.getCompany(req.params.id)); } catch(e: any) { res.status(404).json({ error: e.message }); }});
corporateRouter.post("/company/:id/topup",      async (req, res) => { try { res.json(await svc.topUpWallet(req.params.id, req.body.amount, req.body.payment_ref)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
corporateRouter.get("/company/:id/dashboard",   async (req, res) => { try { res.json(await svc.getDashboard(req.params.id)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
corporateRouter.post("/company/:id/invoice",    async (req, res) => { try { res.json(await svc.generateInvoice(req.params.id)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
corporateRouter.get("/company/:id/invoices",    async (req, res) => { try { res.json(await svc.getInvoices(req.params.id)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
corporateRouter.post("/employee",               async (req, res) => { try { res.json(await svc.addEmployee(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
corporateRouter.get("/company/:id/employees",   async (req, res) => { try { res.json(await svc.listEmployees(req.params.id)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
corporateRouter.post("/authorize",              async (req, res) => { try { const { company_id, employee_id, amount, service_type } = req.body; res.json(await svc.authorizeRide(company_id, employee_id, amount, service_type)); } catch(e: any) { res.status(500).json({ error: e.message }); }});
corporateRouter.post("/ride",                   async (req, res) => { try { res.json(await svc.recordRide(req.body)); } catch(e: any) { res.status(400).json({ error: e.message }); }});
