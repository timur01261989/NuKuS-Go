export type TxType = "topup" | "ride_payment" | "refund" | "cashback" | "bonus" | "withdrawal" | "transfer";

export interface WalletTransaction {
  id:          string;
  user_id:     string;
  type:        TxType;
  amount_uzs:  number;    // positive=credit, negative=debit
  balance_after: number;
  description: string;
  order_id?:   string;
  provider?:   string;
  reference?:  string;
  created_at:  string;
}

export interface Wallet {
  user_id:       string;
  balance_uzs:   number;
  locked_uzs:    number;    // Reserved for in-progress rides
  total_earned:  number;
  total_spent:   number;
  updated_at:    string;
}
