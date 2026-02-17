import React, { useMemo, useState } from "react";
import { Button, Spin, message } from "antd";
import { ArrowLeftOutlined, SwapOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import GallerySlider from "../components/Details/GallerySlider";
import PriceTag from "../components/Common/PriceTag";
import FavoriteButton from "../components/Common/FavoriteButton";
import MainSpecsGrid from "../components/Details/MainSpecsGrid";
import VinCheckBlock from "../components/Details/VinCheckBlock";
import PriceHistoryGraph from "../components/Details/PriceHistoryGraph";
import SellerProfile from "../components/Details/SellerProfile";
import ComfortOptions from "../components/Details/ComfortOptions";
import SafetyTipsCard from "../components/Details/SafetyTipsCard";
import useCarDetails from "../hooks/useCarDetails";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import { useCompare } from "../context/CompareContext";

export default function DetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { car, history, loading, error } = useCarDetails(id);
  const { push } = useRecentlyViewed();
  const { toggle, has, ids, max } = useCompare();
  const [chatOpen, setChatOpen] = useState(false);

  React.useEffect(() => { if (id) push(id); }, [id, push]);

  if (loading) return <div style={{ padding: 30, display:"flex", justifyContent:"center" }}><Spin /></div>;
  if (error) return <div style={{ padding: 14, color:"#ef4444", fontWeight: 900 }}>{error}</div>;
  if (!car) return null;

  const onCompare = () => {
    if (!has(car.id) && ids.length >= max) {
      message.warning(`Solishtirish limiti: ${max} ta`);
      return;
    }
    toggle(car.id);
    message.success(has(car.id) ? "Solishtirishdan olindi" : "Solishtirishga qo'shildi");
  };

  return (
    <div style={{ padding: 14, paddingBottom: 96 }}>
      <div style={{ display:"flex", gap: 10, alignItems:"center", marginBottom: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius: 14 }} />
        <div style={{ fontWeight: 950, fontSize: 16, color:"#0f172a", flex: 1, minWidth: 0 }}>
          {car.brand} {car.model}
        </div>
        <FavoriteButton adId={car.id} />
      </div>

      <GallerySlider images={car.images} />

      <div style={{ marginTop: 12, display:"flex", justifyContent:"space-between", gap: 10, flexWrap:"wrap", alignItems:"center" }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 18, color:"#0f172a" }}>{car.title || `${car.brand} ${car.model} ${car.year}`}</div>
          <div style={{ fontSize: 12, color:"#64748b", marginTop: 4 }}>{car.city} • {new Date(car.created_at).toLocaleDateString("uz-UZ")}</div>
        </div>
        <PriceTag price={car.price} currency={car.currency} size={18} />
      </div>

      <div style={{ marginTop: 12, display:"grid", gap: 12 }}>
        <MainSpecsGrid car={car} />
        <ComfortOptions comfort={car.comfort} />
        <VinCheckBlock vin={car.vin} />
        <PriceHistoryGraph history={history} />
        <SellerProfile seller={car.seller} onChat={()=>message.info("Chat: keyingi bosqichda realtime ulaymiz")} />
        <SafetyTipsCard />
      </div>

      <div style={{ position:"fixed", left: 0, right: 0, bottom: 0, background:"#ffffffcc", backdropFilter:"blur(10px)", borderTop:"1px solid #e2e8f0", padding: 12, display:"flex", gap: 10 }}>
        <Button
          icon={<SwapOutlined />}
          onClick={onCompare}
          style={{ borderRadius: 14, flex: 1 }}
        >
          {has(car.id) ? "Remove compare" : "Compare"}
        </Button>
        <Button
          type="primary"
          onClick={() => {
            if (car?.seller?.phone) window.location.href = `tel:${car.seller.phone}`;
            else message.info("Raqam yo'q");
          }}
          style={{ borderRadius: 14, flex: 1, background:"#0ea5e9", border:"none" }}
        >
          Tel qilish
        </Button>
      </div>
    </div>
  );
}
