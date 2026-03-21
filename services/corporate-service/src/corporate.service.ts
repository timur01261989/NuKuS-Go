import { createClient } from "@supabase/supabase-js";
import { Company, Employee, CorporateRide, Invoice, SpendingPolicy } from "./corporate.types";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class CorporateService {

  // ── Company Management ──────────────────────────────────────────
  async createCompany(data: Omit<Company, "id" | "wallet_balance" | "created_at">): Promise<Company> {
    const { data: company, error } = await sb.from("corporate_companies")
      .insert({ ...data, wallet_balance: 0, created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return company as Company;
  }

  async getCompany(id: string): Promise<Company> {
    const { data, error } = await sb.from("corporate_companies").select("*").eq("id", id).single();
    if (error || !data) throw new Error("Company not found");
    return data as Company;
  }

  async topUpWallet(companyId: string, amount: number, paymentRef: string): Promise<Company> {
    const { data: company } = await sb.from("corporate_companies")
      .select("wallet_balance").eq("id", companyId).single();
    if (!company) throw new Error("Company not found");
    const newBalance = (company as any).wallet_balance + amount;
    const { data, error } = await sb.from("corporate_companies")
      .update({ wallet_balance: newBalance }).eq("id", companyId).select().single();
    if (error) throw error;
    await sb.from("corporate_wallet_transactions").insert({
      company_id: companyId, amount, type: "credit",
      reference: paymentRef, balance_after: newBalance,
      created_at: new Date().toISOString(),
    });
    return data as Company;
  }

  // ── Employee Management ─────────────────────────────────────────
  async addEmployee(data: Omit<Employee, "id" | "spent_this_month" | "added_at">): Promise<Employee> {
    const { data: emp, error } = await sb.from("corporate_employees")
      .insert({ ...data, spent_this_month: 0, added_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return emp as Employee;
  }

  async listEmployees(companyId: string): Promise<Employee[]> {
    const { data } = await sb.from("corporate_employees")
      .select("*").eq("company_id", companyId).eq("active", true)
      .order("full_name");
    return (data || []) as Employee[];
  }

  // ── Ride Authorization ──────────────────────────────────────────
  async authorizeRide(
    companyId: string, employeeId: string, amount: number, serviceType: string
  ): Promise<{ authorized: boolean; reason?: string }> {
    const [companyRes, empRes] = await Promise.all([
      sb.from("corporate_companies").select("*").eq("id", companyId).single(),
      sb.from("corporate_employees").select("*").eq("id", employeeId).single(),
    ]);

    const company  = companyRes.data as Company | null;
    const employee = empRes.data as Employee | null;
    if (!company || !employee) return { authorized: false, reason: "Company or employee not found" };

    const policy = company.spending_policy;

    // Check service type
    if (!policy.allowed_services.includes(serviceType))
      return { authorized: false, reason: `${serviceType} xizmati ruxsat etilmagan` };

    // Check ride price limit
    if (amount > policy.max_ride_price_uzs)
      return { authorized: false, reason: `Narx limitdan oshib ketdi (${policy.max_ride_price_uzs.toLocaleString("ru")} so'm)` };

    // Check employee monthly limit
    if (employee.spent_this_month + amount > employee.monthly_budget_uzs)
      return { authorized: false, reason: "Oylik limit tugadi" };

    // Check company daily spending
    const today = new Date().toISOString().slice(0, 10);
    const { data: dailyRides } = await sb.from("corporate_rides")
      .select("amount_uzs").eq("company_id", companyId)
      .gte("created_at", today);
    const dailyTotal = (dailyRides || []).reduce((s: number, r: any) => s + r.amount_uzs, 0);
    if (dailyTotal + amount > policy.max_daily_uzs)
      return { authorized: false, reason: "Kunlik korporativ limit tugadi" };

    // Check work hours
    if (policy.work_hours_only) {
      const hour = new Date().getHours();
      const day  = new Date().getDay();
      if (!policy.allowed_days.includes(day)) return { authorized: false, reason: "Ish kuni emas" };
      if (hour < 8 || hour >= 20)             return { authorized: false, reason: "Ish vaqti emas (08:00-20:00)" };
    }

    // Check wallet balance
    if (company.wallet_balance < amount) return { authorized: false, reason: "Korporativ hamyon bo'sh" };

    return { authorized: true };
  }

  async recordRide(data: Omit<CorporateRide, "id" | "status" | "created_at">): Promise<CorporateRide> {
    const { data: ride, error } = await sb.from("corporate_rides")
      .insert({ ...data, status: "pending", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;

    // Deduct from wallet
    await sb.rpc("deduct_corporate_wallet", { company_id: data.company_id, amount: data.amount_uzs });

    // Update employee monthly spend
    await sb.rpc("increment_employee_spend", { employee_id: data.employee_id, amount: data.amount_uzs });

    return ride as CorporateRide;
  }

  // ── Invoicing ───────────────────────────────────────────────────
  async generateInvoice(companyId: string): Promise<Invoice> {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end   = now.toISOString().slice(0, 10);

    const { data: rides } = await sb.from("corporate_rides")
      .select("*")
      .eq("company_id", companyId)
      .gte("created_at", start)
      .eq("status", "pending");

    const total = (rides || []).reduce((s: number, r: any) => s + r.amount_uzs, 0);

    const { data: invoice, error } = await sb.from("corporate_invoices")
      .insert({
        company_id: companyId, period_start: start, period_end: end,
        total_rides: (rides || []).length, total_amount_uzs: total,
        status: "draft", created_at: new Date().toISOString(),
      }).select().single();
    if (error) throw error;

    // Mark rides as invoiced
    if (rides?.length) {
      await sb.from("corporate_rides").update({ status: "invoiced", invoice_id: invoice.id })
        .in("id", rides.map((r: any) => r.id));
    }

    return invoice as Invoice;
  }

  async getInvoices(companyId: string): Promise<Invoice[]> {
    const { data } = await sb.from("corporate_invoices")
      .select("*").eq("company_id", companyId)
      .order("created_at", { ascending: false });
    return (data || []) as Invoice[];
  }

  async getDashboard(companyId: string) {
    const now       = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const [rides, employees, wallet] = await Promise.all([
      sb.from("corporate_rides").select("amount_uzs, status, created_at")
        .eq("company_id", companyId).gte("created_at", monthStart),
      sb.from("corporate_employees").select("id, full_name, spent_this_month, monthly_budget_uzs")
        .eq("company_id", companyId).eq("active", true).order("spent_this_month", { ascending: false }).limit(10),
      sb.from("corporate_companies").select("wallet_balance, credit_limit").eq("id", companyId).single(),
    ]);

    const rideData = rides.data || [];
    return {
      wallet_balance:      (wallet.data as any)?.wallet_balance || 0,
      credit_limit:        (wallet.data as any)?.credit_limit   || 0,
      month_total_rides:   rideData.length,
      month_total_uzs:     rideData.reduce((s: number, r: any) => s + r.amount_uzs, 0),
      top_spenders:        employees.data || [],
    };
  }
}
