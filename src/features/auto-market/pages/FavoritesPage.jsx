import React, { useEffect, useState } from "react";
import { Button, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listFavoriteCars } from "../services/marketApi";
import CarCardHorizontal from "../components/Feed/CarCardHorizontal";
import { useMarket } from "../context/MarketContext";

export default function FavoritesPage() {
  const nav = useNavigate();
  const { filters } = useMarket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listFavoriteCars(filters);
      setItems(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filters.q, filters.brand, filters.model, filters.city]);

  return (
    <div style={{ padding: 14, paddingBottom: 80 }}>
      <div style={{ display:"flex", gap: 10, alignItems:"center", marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius: 14 }} />
        <div style={{ fontWeight: 950, fontSize: 18, color:"#0f172a" }}>Sevimlilar</div>
      </div>

      {loading ? <div style={{ display:"flex", justifyContent:"center", padding: 30 }}><Spin /></div> : null}

      <div style={{ display:"grid", gap: 10 }}>
        {items.map(ad => (
          <CarCardHorizontal key={ad.id} ad={ad} onClick={()=>nav(`/auto-market/ad/${ad.id}`)} />
        ))}
      </div>

      {!loading && !items.length ? (
        <div style={{ marginTop: 20, color:"#64748b", fontWeight: 800 }}>Hozircha sevimlilar yo'q.</div>
      ) : null}
    </div>
  );
}
