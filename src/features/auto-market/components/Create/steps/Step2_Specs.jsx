import React from "react";
import { Card, Input, Select, Switch, InputNumber } from "antd";
import { useCreateAd } from "../../../context/CreateAdContext";
import { CITIES, FUELS, TRANSMISSIONS, COLORS, BODY_TYPES, DRIVE_TYPES, ALL_MODELS_FLAT } from "../../../services/staticData";

/**
 * Step2_Specs
 * Asl funksionallik to'liq saqlangan.
 * YANGI: Vikupga berish toggle + vikup shartlari + Barter toggle + barter model
 */
export default function Step2_Specs() {
  const { ad, patch } = useCreateAd();

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a" }}>Parametrlar</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yil</div>
          <Input value={ad.year} onChange={(e)=>patch({ year: e.target.value })} placeholder="Masalan: 2020" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Probeg (km)</div>
          <Input value={ad.mileage} onChange={(e)=>patch({ mileage: e.target.value })} placeholder="Masalan: 85000" />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yoqilg'i</div>
          <Select value={ad.fuel_type || undefined} onChange={(v)=>patch({ fuel_type: v })} options={FUELS.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Uzatma</div>
          <Select value={ad.transmission || undefined} onChange={(v)=>patch({ transmission: v })} options={TRANSMISSIONS.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Rang</div>
          <Select value={ad.color || undefined} onChange={(v)=>patch({ color: v })} options={COLORS.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Shahar</div>
          <Select value={ad.city || undefined} onChange={(v)=>patch({ city: v, location: { ...ad.location, city: v } })} options={CITIES.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Kuzov</div>
          <Select value={ad.body_type || undefined} onChange={(v)=>patch({ body_type: v })} options={BODY_TYPES.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Privod</div>
          <Select value={ad.drive_type || undefined} onChange={(v)=>patch({ drive_type: v })} options={DRIVE_TYPES.map(x=>({value:x,label:x}))} style={{ width: "100%" }} />
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Motor</div>
          <Input value={ad.engine} onChange={(e)=>patch({ engine: e.target.value })} placeholder="Masalan: 1.6L" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>VIN (ixtiyoriy)</div>
          <Input value={ad.vin} onChange={(e)=>patch({ vin: e.target.value })} placeholder="XTA..." />
        </div>
      </div>

      {/* Asl switch'lar */}
      <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Switch checked={!!ad.kredit} onChange={(v)=>patch({ kredit: v })} />
          <span style={{ fontWeight: 800, color: "#0f172a" }}>Kredit</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Switch checked={!!ad.exchange} onChange={(v)=>patch({ exchange: v })} />
          <span style={{ fontWeight: 800, color: "#0f172a" }}>Obmen</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Switch checked={!!ad.is_top} onChange={(v)=>patch({ is_top: v })} />
          <span style={{ fontWeight: 800, color: "#0f172a" }}>TOP e'lon</span>
        </div>
        {/* YANGI */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Switch checked={!!ad.vikup} onChange={(v)=>patch({ vikup: v })} />
          <span style={{ fontWeight: 800, color: "#d97706" }}>💳 Vikupga berish</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Switch checked={!!ad.barter} onChange={(v)=>patch({ barter: v })} />
          <span style={{ fontWeight: 800, color: "#059669" }}>🔄 Barter qabul</span>
        </div>
      </div>

      {/* Vikup shartlari */}
      {ad.vikup && (
        <div style={{ marginTop: 14, padding: 12, background: "#fffbeb", borderRadius: 14, border: "1.5px solid #fde68a" }}>
          <div style={{ fontWeight: 800, color: "#d97706", marginBottom: 10 }}>💳 Vikup shartlari</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Boshlang'ich to'lov ($)</div>
              <InputNumber
                value={ad.vikup_initial ? Number(ad.vikup_initial) : null}
                onChange={(v) => patch({ vikup_initial: String(v || "") })}
                style={{ width: "100%" }} min={0} placeholder="2000"
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Oylik to'lov ($)</div>
              <InputNumber
                value={ad.vikup_monthly ? Number(ad.vikup_monthly) : null}
                onChange={(v) => patch({ vikup_monthly: String(v || "") })}
                style={{ width: "100%" }} min={0} placeholder="300"
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Muddat (oy)</div>
              <Select
                value={ad.vikup_months || "12"}
                onChange={(v) => patch({ vikup_months: v })}
                style={{ width: "100%" }}
                options={["6","12","18","24","36","48","60"].map(x=>({value:x,label:`${x} oy`}))}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Foiz (yillik %)</div>
              <InputNumber
                value={ad.vikup_interest ? Number(ad.vikup_interest) : 0}
                onChange={(v) => patch({ vikup_interest: String(v || "0") })}
                style={{ width: "100%" }} min={0} max={100} placeholder="0"
              />
            </div>
          </div>
          {ad.vikup_monthly && ad.vikup_months && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#92400e", fontWeight: 700 }}>
              Umumiy: ${(Number(ad.vikup_initial||0) + Number(ad.vikup_monthly||0) * Number(ad.vikup_months||0)).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Barter qabul qilish — qaysi mashina? */}
      {ad.barter && (
        <div style={{ marginTop: 14, padding: 12, background: "#f0fdf4", borderRadius: 14, border: "1.5px solid #86efac" }}>
          <div style={{ fontWeight: 800, color: "#059669", marginBottom: 10 }}>🔄 Qaysi mashina qabul qilinadi?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Marka</div>
              <Select
                value={ad.barter_brand || undefined}
                onChange={(v) => patch({ barter_brand: v, barter_model: "" })}
                allowClear
                placeholder="Har qanday"
                style={{ width: "100%" }}
                options={[{ value: "", label: "Har qanday" }, ...["Chevrolet","KIA","Hyundai","Toyota","Mercedes","BMW"].map(b => ({ value: b, label: b }))]}
              />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Model</div>
              <Input
                value={ad.barter_model}
                onChange={(e) => patch({ barter_model: e.target.value })}
                placeholder="Masalan: Cobalt"
              />
            </div>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
            <Switch checked={!!ad.barter_extra_ok} onChange={(v) => patch({ barter_extra_ok: v })} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>Ustiga pul to'lashga tayyor</span>
          </div>
        </div>
      )}
    </Card>
  );
}
