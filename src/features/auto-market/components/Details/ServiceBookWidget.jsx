/**
 * ServiceBookWidget.jsx
 * "Rasxod Daftar" — mashina xizmat tarixi va eslatmalar.
 * E'lon sahifasida emas, alohida GarajPage ichida ishlatiladi.
 * Props: book (service_books row), onAddRecord()
 */
import React, { useMemo } from "react";
import { Card, Tag, Progress, Button, Tooltip } from "antd";
import { ToolOutlined, AlertOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { SERVICE_TYPES } from "../../services/staticData";
import { useAutoMarketI18n } from "../../utils/useAutoMarketI18n";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function kmUntil(nextKm, currentKm) {
  if (!nextKm || !currentKm) return null;
  return nextKm - currentKm;
}

export default function ServiceBookWidget({ book, onAddRecord }) {
  const { am } = useAutoMarketI18n();
  if (!book) return null;

  const oilKmLeft = useMemo(() => {
    const nextKm = (book.last_oil_change || 0) + (book.oil_change_km || 10000);
    return kmUntil(nextKm, book.current_mileage);
  }, [book]);

  const insuranceDays = useMemo(() => daysUntil(book.insurance_expiry), [book.insurance_expiry]);
  const texDays       = useMemo(() => daysUntil(book.tex_expiry), [book.tex_expiry]);

  const oilPct = useMemo(() => {
    const km = book.oil_change_km || 10000;
    const done = km - Math.max(0, oilKmLeft ?? km);
    return Math.min(100, Math.round((done / km) * 100));
  }, [oilKmLeft, book.oil_change_km]);

  const oilColor = oilKmLeft !== null
    ? oilKmLeft < 1000 ? "#ef4444" : oilKmLeft < 3000 ? "#f59e0b" : "#22c55e"
    : "#94a3b8";

  const getExpireColor = (days) => {
    if (days === null) return "#94a3b8";
    if (days < 7)  return "#ef4444";
    if (days < 30) return "#f59e0b";
    return "#22c55e";
  };

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 16 }}>
      <div style={{ display:"flex", gap: 10, alignItems:"center", marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 14,
          background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
          display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
          boxShadow: "0 8px 20px rgba(59,130,246,.3)",
        }}>
          <ToolOutlined />
        </div>
        <div>
          <div style={{ fontWeight: 900, color:"#0f172a" }}>
            {book.car_brand} {book.car_model} {book.car_year}
          </div>
          <div style={{ fontSize: 12, color:"#64748b" }}>
            {Number(book.current_mileage||0).toLocaleString("uz-UZ")} km
          </div>
        </div>
        {onAddRecord && (
          <Button size="small" onClick={onAddRecord} style={{ marginLeft:"auto", borderRadius: 10 }}>
            + {am("serviceBook.addRecord")}
          </Button>
        )}
      </div>

      {/* Moy almashtirish */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 4, fontSize: 12 }}>
          <span style={{ fontWeight:700 }}>{am("serviceBook.oilChange")}</span>
          <span style={{ fontWeight:800, color: oilColor }}>
            {oilKmLeft !== null
              ? oilKmLeft > 0
                ? `${Number(oilKmLeft).toLocaleString("uz-UZ")} km qoldi`
                : "❗ Vaqti o'tdi!"
              : am("serviceBook.notEntered")}
          </span>
        </div>
        <Progress percent={oilPct} strokeColor={oilColor} showInfo={false} size="small" />
      </div>

      {/* Sug'urta */}
      {book.insurance_expiry && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 8, fontSize: 12 }}>
          <span style={{ fontWeight:700 }}>{am("serviceBook.insurance")}</span>
          <Tag color={getExpireColor(insuranceDays) === "#22c55e" ? "success" : getExpireColor(insuranceDays) === "#f59e0b" ? "warning" : "error"}>
            {insuranceDays !== null
              ? insuranceDays > 0
                ? `${insuranceDays} kun qoldi`
                : "❗ Muddati o'tdi!"
              : new Date(book.insurance_expiry).toLocaleDateString("uz-UZ")}
          </Tag>
        </div>
      )}

      {/* Texosmotr */}
      {book.tex_expiry && (
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom: 8, fontSize: 12 }}>
          <span style={{ fontWeight:700 }}>{am("serviceBook.inspection")}</span>
          <Tag color={getExpireColor(texDays) === "#22c55e" ? "success" : getExpireColor(texDays) === "#f59e0b" ? "warning" : "error"}>
            {texDays !== null
              ? texDays > 0
                ? `${texDays} kun qoldi`
                : "❗ Muddati o'tdi!"
              : new Date(book.tex_expiry).toLocaleDateString("uz-UZ")}
          </Tag>
        </div>
      )}

      {/* Oxirgi yozuvlar */}
      {(book.records || []).length > 0 && (
        <div style={{ marginTop: 10, borderTop:"1px solid #f1f5f9", paddingTop: 10 }}>
          <div style={{ fontSize: 11, color:"#64748b", fontWeight:700, marginBottom: 6 }}>{am("serviceBook.recent")}</div>
          {[...(book.records || [])].reverse().slice(0, 3).map(r => (
            <div key={r.id} style={{ display:"flex", justifyContent:"space-between", fontSize: 12, marginBottom: 4 }}>
              <span>{SERVICE_TYPES.find(s=>s.id===r.service_type)?.emoji || "📝"} {r.title}</span>
              <span style={{ color:"#94a3b8" }}>{r.mileage_at ? `${Number(r.mileage_at).toLocaleString("uz-UZ")} km` : new Date(r.created_at).toLocaleDateString("uz-UZ")}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
