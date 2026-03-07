import React from "react";
import { Button, InputNumber, Select, message, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPayment } from "../services/marketBackend";
import useWalletBalance from "../hooks/useWalletBalance";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

export default function TopUpPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const { balance, loading: balLoading, refresh } = useWalletBalance();

  const need = Number(sp.get("need") || 0);
  const next = sp.get("next") || "";

  const [provider, setProvider] = React.useState("demo");
  const [amount, setAmount] = React.useState(need > 0 ? need : 50000);
  const [loading, setLoading] = React.useState(false);

  const onPay = async () => {
    try {
      if (!amount || amount <= 0) {
        message.error(am("app.enterAmount"));
        return;
      }
      setLoading(true);
      const res = await createPayment({ provider, amount_uzs: amount, return_url: window.location.origin + "/auto-market/topup" });

      if (res?.status === "paid" && res?.ok) {
        message.success(am("app.topUpSuccess"));
        await refresh();
        if (next) nav(next);
        else nav(-1);
        return;
      }

      if (res?.payment_url) {
        // open provider checkout
        window.open(res.payment_url, "_blank", "noopener,noreferrer");
        message.info("To'lov sahifasi ochildi. To'lovdan keyin qaytib keling.");
        return;
      }

      message.warning(res?.note || "Payment yaratildi, lekin payment_url yo'q. ENV keylarni tekshiring.");
    } catch (e) {
      message.error(e?.message || am("app.topUpError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 14, paddingBottom: 96 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => nav(-1)} style={{ borderRadius: 14 }} />
        <div style={{ fontWeight: 950, fontSize: 16, color: "#0f172a" }}>{am("app.topUp")}</div>
      </div>

      <div style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>{am("app.currentBalance")}</div>
          <div style={{ fontWeight: 950 }}>
            {balLoading ? <Spin size="small" /> : `${Number(balance || 0).toLocaleString("uz-UZ")} UZS`}
          </div>
        </div>

        {need > 0 && (
          <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 800, marginBottom: 10 }}>
            ⚠️ {am("app.topUpNeed")}: {need.toLocaleString("uz-UZ")} UZS
          </div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{am("app.topUpProvider")}</div>
            <Select
              value={provider}
              onChange={setProvider}
              style={{ width: "100%" }}
              options={[
                { value: "demo", label: "Demo (darhol to'ldiradi)" },
                { value: "payme", label: "Payme" },
                { value: "click", label: "Click" },
              ]}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{am("app.topUpAmount")} (UZS)</div>
            <InputNumber
              value={amount}
              onChange={(v) => setAmount(Number(v || 0))}
              min={1000}
              step={1000}
              style={{ width: "100%" }}
            />
          </div>

          <Button
            type="primary"
            onClick={onPay}
            loading={loading}
            style={{ borderRadius: 14, height: 44, background: "#0ea5e9", border: "none" }}
          >
            To'lash
          </Button>

          <div style={{ fontSize: 12, color: "#64748b" }}>
            Payme/Click ishlashi uchun Vercel ENV'ga merchant keylarni qo'ying.
            Contract bo'lmaguncha demo provider ishlatavering.
          </div>
        </div>
      </div>
    </div>
  );
}
