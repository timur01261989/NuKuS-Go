import React, { useEffect, useState } from "react";
import { Button, Spin, Table } from "antd";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useCompare } from "../context/CompareContext";
import { getCarById } from "../services/marketApi";
import { formatPrice } from "../services/priceUtils";

export default function ComparePage() {
  const nav = useNavigate();
  const { ids, remove, clear } = useCompare();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await Promise.all(ids.map(id => getCarById(id)));
        if (mounted) setCars(res);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [ids]);

  const rows = [
    { key: "brand", name: "Marka", v: (c) => c.brand },
    { key: "model", name: "Model", v: (c) => c.model },
    { key: "year", name: "Yil", v: (c) => c.year },
    { key: "mileage", name: "Probeg", v: (c) => (c.mileage ?? "-") + " km" },
    { key: "engine", name: "Motor", v: (c) => c.engine },
    { key: "fuel", name: "Yoqilg'i", v: (c) => c.fuel_type },
    { key: "trans", name: "Uzatma", v: (c) => c.transmission },
    { key: "price", name: "Narx", v: (c) => formatPrice(c.price, c.currency) },
    { key: "city", name: "Shahar", v: (c) => c.city },
  ];

  return (
    <div style={{ padding: 14, paddingBottom: 60 }}>
      <div style={{ display:"flex", gap: 10, alignItems:"center", marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius: 14 }} />
        <div style={{ fontWeight: 950, fontSize: 18, color:"#0f172a", flex:1 }}>Solishtirish</div>
        <Button icon={<DeleteOutlined />} onClick={clear} danger style={{ borderRadius: 12 }}>Tozalash</Button>
      </div>

      {loading ? <div style={{ display:"flex", justifyContent:"center", padding: 30 }}><Spin /></div> : null}

      {!loading && !ids.length ? (
        <div style={{ color:"#64748b", fontWeight: 800 }}>Solishtirish bo'sh.</div>
      ) : null}

      {!loading && ids.length ? (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 10px" }}>
            <thead>
              <tr>
                <th style={{ textAlign:"left", color:"#64748b", fontSize: 12, padding: 8 }}>Parametr</th>
                {cars.map(c => (
                  <th key={c.id} style={{ textAlign:"left", padding: 8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap: 10 }}>
                      <div style={{ fontWeight: 900, color:"#0f172a" }}>{c.brand} {c.model}</div>
                      <Button size="small" onClick={()=>remove(c.id)} style={{ borderRadius: 999 }}>X</Button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key} style={{ background:"#fff", border:"1px solid #e2e8f0" }}>
                  <td style={{ padding: 10, fontWeight: 900, color:"#0f172a", borderTopLeftRadius: 14, borderBottomLeftRadius: 14, border:"1px solid #e2e8f0" }}>{r.name}</td>
                  {cars.map(c => (
                    <td key={c.id + r.key} style={{ padding: 10, border:"1px solid #e2e8f0" }}>{r.v(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
