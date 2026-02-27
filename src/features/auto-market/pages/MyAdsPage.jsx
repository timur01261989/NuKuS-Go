import React, { useEffect, useState } from "react";
import { Button, Spin, Tag } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { myAds, markAdStatus } from "../services/marketApi";
import CarCardHorizontal from "../components/Feed/CarCardHorizontal";

export default function MyAdsPage() {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await myAds()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 14, paddingBottom: 80 }}>
      <div style={{ display:"flex", gap: 10, alignItems:"center", marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius: 14 }} />
        <div style={{ fontWeight: 950, fontSize: 18, color:"#0f172a", flex:1 }}>Mening e'lonlarim</div>
        <Button icon={<PlusOutlined />} type="primary" style={{ borderRadius: 12, background:"#22c55e", border:"none" }} onClick={()=>nav("/auto-market/create")}>
          Yangi
        </Button>
      </div>

      {loading ? <div style={{ display:"flex", justifyContent:"center", padding: 30 }}><Spin /></div> : null}

      <div style={{ display:"grid", gap: 10 }}>
        {items.map(ad => (
          <div key={ad.id} style={{ display:"grid", gap: 8 }}>
            <CarCardHorizontal ad={ad} onClick={()=>nav(`/auto-market/ad/${ad.id}`)} />
            <div style={{ display:"flex", gap: 8, flexWrap:"wrap" }}>
              <Tag color={ad.status === "active" ? "green" : ad.status === "sold" ? "volcano" : "default"} style={{ borderRadius: 999 }}>
                {ad.status}
              </Tag>
              <Button size="small" style={{ borderRadius: 999 }} onClick={async ()=>{ await markAdStatus(ad.id, "sold"); load(); }}>
                Sotildi
              </Button>
              <Button size="small" style={{ borderRadius: 999 }} onClick={async ()=>{ await markAdStatus(ad.id, "archived"); load(); }}>
                Arxiv
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!loading && !items.length ? (
        <div style={{ marginTop: 20, color:"#64748b", fontWeight: 800 }}>Siz hali e'lon bermagansiz.</div>
      ) : null}
    </div>
  );
}
