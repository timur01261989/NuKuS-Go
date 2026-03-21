export interface Company {
  id:              string;
  name:            string;
  bin:             string;   // Biznes identifikatsiya raqami (O'zbekiston)
  contact_email:   string;
  contact_phone:   string;
  wallet_balance:  number;
  credit_limit:    number;
  invoice_cycle:   "weekly" | "biweekly" | "monthly";
  auto_top_up:     boolean;
  auto_top_up_amount: number;
  spending_policy: SpendingPolicy;
  status:          "active" | "suspended" | "trial";
  created_at:      string;
}

export interface SpendingPolicy {
  max_ride_price_uzs:    number;       // Per ride limit
  allowed_services:      string[];     // ["taxi","delivery","freight"]
  work_hours_only:       boolean;
  allowed_days:          number[];     // 0=Sun ... 6=Sat
  require_purpose:       boolean;      // Force driver comment
  max_daily_uzs:         number;       // Per employee daily limit
  max_monthly_uzs:       number;
  approved_zones?:       string[];     // Only rides within these zones
}

export interface Employee {
  id:              string;
  company_id:      string;
  user_id:         string;
  full_name:       string;
  email:           string;
  department:      string;
  role:            "employee" | "manager" | "admin";
  monthly_budget_uzs: number;
  spent_this_month:   number;
  active:          boolean;
  added_at:        string;
}

export interface CorporateRide {
  id:              string;
  company_id:      string;
  employee_id:     string;
  order_id:        string;
  purpose?:        string;
  amount_uzs:      number;
  status:          "pending" | "approved" | "rejected" | "invoiced";
  invoice_id?:     string;
  created_at:      string;
}

export interface Invoice {
  id:              string;
  company_id:      string;
  period_start:    string;
  period_end:      string;
  total_rides:     number;
  total_amount_uzs:number;
  status:          "draft" | "sent" | "paid" | "overdue";
  pdf_url?:        string;
  paid_at?:        string;
  created_at:      string;
}
