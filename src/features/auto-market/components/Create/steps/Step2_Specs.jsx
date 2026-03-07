import React, { useState } from "react";
import { Card, Input, Select, Switch, InputNumber, Tag, Row, Col, Divider, Tooltip } from "antd";
import { useCreateAd } from "../../../context/CreateAdContext";
import { CITIES, FUELS, TRANSMISSIONS, COLORS, BODY_TYPES, DRIVE_TYPES, ALL_MODELS_FLAT } from "../../../services/staticData";
import { BgColorsOutlined, AppstoreAddOutlined, RetweetOutlined, DollarOutlined, InfoCircleOutlined } from "@ant-design/icons";

/**
 * Step2_Specs
 * Asl funksionallik to'liq saqlangan.
 * YANGI: Vizual Kuzov (Kraska) sxemasi + Aqlli Komplektatsiya + Vikup/Barter kengaytirilgan qismi
 */
export default function Step2_Specs() {
  const { ad, patch } = useCreateAd();

  // Kuzov qismlari uchun holat (agar ad.body_parts bo'lmasa bo'sh obyekt)
  const bodyParts = ad.body_parts || {};

  const togglePart = (part) => {
    const current = bodyParts[part] || "clean";
    const nextMap = { "clean": "painted", "painted": "replaced", "replaced": "clean" };
    const nextStatus = nextMap[current];
    
    patch({
      body_parts: { ...bodyParts, [part]: nextStatus }
    });
  };

  const getPartColor = (part) => {
    const status = bodyParts[part];
    if (status === "painted") return "#f59e0b"; // Sariq - Bo'yalgan
    if (status === "replaced") return "#ef4444"; // Qizil - Almashgan
    return "#e2e8f0"; // Kulrang - Toza
  };

  // Komplektatsiya opsiyalari
  const features = ["Lyuk", "Konditsioner", "ABS", "Video registrator", "Muzlatgich", "Charm salon", "Ksenon", "Parktronik"];

  const toggleFeature = (f) => {
    const current = ad.features || [];
    if (current.includes(f)) {
      patch({ features: current.filter(i => i !== f) });
    } else {
      patch({ features: [...current, f] });
    }
  };

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>Parametrlar</div>

      {/* Asosiy Xarakteristikalar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yil</div>
          <Input value={ad.year} onChange={(e)=>patch({ year: e.target.value })} placeholder="Masalan: 2020" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Probeg (km)</div>
          <Input value={ad.mileage} onChange={(e)=>patch({ mileage: e.target.value })} placeholder="Masalan: 45000" />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Yoqilg'i turi</div>
        <Select
          value={ad.fuel_type || undefined}
          onChange={(v) => patch({ fuel_type: v })}
          style={{ width: "100%" }}
          options={FUELS.map(f => ({ value: f, label: f }))}
          placeholder="Tanlang"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Uzatmalar qutisi</div>
          <Select
            value={ad.transmission || undefined}
            onChange={(v) => patch({ transmission: v })}
            style={{ width: "100%" }}
            options={TRANSMISSIONS.map(t => ({ value: t, label: t }))}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 6 }}>Rangi</div>
          <Select
            value={ad.color || undefined}
            onChange={(v) => patch({ color: v })}
            style={{ width: "100%" }}
            options={COLORS.map(c => ({ value: c, label: c }))}
          />
        </div>
      </div>

      <Divider style={{ margin: "20px 0" }} />

      {/* YANGI: Vizual Kuzov Holati */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <BgColorsOutlined /> Kuzov holati (Kraska)
          <Tooltip title="Mashina qismlari ustiga bosib holatini belgilang">
            <InfoCircleOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
          </Tooltip>
        </div>
        <div style={{ background: "#f8fafc", padding: 15, borderRadius: 12, textAlign: "center" }}>
          {/* Vizual Sxema Imittatsiyasi (SVG yoki Oddiy Bloklar) */}
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 10 }}>
            <div onClick={() => togglePart('kapot')} style={{ width: 60, height: 40, background: getPartColor('kapot'), border: "1px solid #cbd5e1", borderRadius: "4px 4px 0 0", cursor: "pointer", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Kapot</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
            <div onClick={() => togglePart('left_door')} style={{ width: 40, height: 60, background: getPartColor('left_door'), border: "1px solid #cbd5e1", cursor: "pointer", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chap</div>
            <div style={{ width: 50, height: 60, background: "#e2e8f0", border: "1px solid #cbd5e1", display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>Tom</div>
            <div onClick={() => togglePart('right_door')} style={{ width: 40, height: 60, background: getPartColor('right_door'), border: "1px solid #cbd5e1", cursor: "pointer", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>O'ng</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 10 }}>
            <div onClick={() => togglePart('bagaj')} style={{ width: 60, height: 35, background: getPartColor('bagaj'), border: "1px solid #cbd5e1", borderRadius: "0 0 4px 4px", cursor: "pointer", fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Bagaj</div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 15 }}>
            <Tag color="default">Toza</Tag>
            <Tag color="warning">Bo'yalgan</Tag>
            <Tag color="error">Almashgan</Tag>
          </div>
        </div>
      </div>

      {/* YANGI: Aqlli Komplektatsiya */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AppstoreAddOutlined /> Komplektatsiya va Opsiyalar
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {features.map(f => (
            <Tag.CheckableTag
              key={f}
              checked={(ad.features || []).includes(f)}
              onChange={() => toggleFeature(f)}
              style={{ border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: 8, fontSize: 13 }}
            >
              {f}
            </Tag.CheckableTag>
          ))}
        </div>
      </div>

      <Divider style={{ margin: "20px 0" }} />

      {/* Vikup va Barter (Mavjud funksiyalar to'liq saqlangan) */}
      <div style={{ background: "#f1f5f9", padding: 12, borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, color: "#1e293b", display: 'flex', alignItems: 'center', gap: 6 }}>
            <DollarOutlined style={{ color: '#10b981' }} /> Vikupga (Ijaraga) berish
          </div>
          <Switch checked={!!ad.is_vikup} onChange={(v) => patch({ is_vikup: v })} />
        </div>

        {ad.is_vikup && (
          <div style={{ background: "#fff", padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Boshlang'ich ($)</div>
                <InputNumber value={ad.vikup_deposit} onChange={(v)=>patch({ vikup_deposit: v })} style={{ width: "100%" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Oylik ($)</div>
                <InputNumber value={ad.vikup_monthly} onChange={(v)=>patch({ vikup_monthly: v })} style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, color: "#1e293b", display: 'flex', alignItems: 'center', gap: 6 }}>
            <RetweetOutlined style={{ color: '#3b82f6' }} /> Barter (Almashish)
          </div>
          <Switch checked={!!ad.is_barter} onChange={(v) => patch({ is_barter: v })} />
        </div>

        {ad.is_barter && (
          <div style={{ background: "#fff", padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 800, color: "#059669", marginBottom: 10, fontSize: 12 }}>🔄 Qaysi mashina qabul qilinadi?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Marka</div>
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
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Model</div>
                <Input
                  value={ad.barter_model}
                  onChange={(e) => patch({ barter_model: e.target.value })}
                  placeholder="Masalan: Cobalt"
                />
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <Switch size="small" checked={!!ad.barter_extra_ok} onChange={(v) => patch({ barter_extra_ok: v })} />
              <span style={{ fontSize: 12, color: "#475569" }}>Doplata (ustiga pul berish)ga roziman</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}