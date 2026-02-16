import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMarket } from "../context/MarketContext";
import { useMarketStore } from "../stores/marketStore";
import PriceTag from "../components/Common/PriceTag";
import StatusBadge from "../components/Common/StatusBadge";

export default function DetailsPage() {
  const { id } = useParams();
  const { fetchDetails } = useMarket();
  const { pushRecent, addToCompare } = useMarketStore();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const c = await fetchDetails(id);
        if (!alive) return;
        setCar(c);
        pushRecent(c);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, fetchDetails, pushRecent]);

  if (loading) return <div style={{ padding: 18 }}>Yuklanmoqda...</div>;
  if (!car) return <div style={{ padding: 18 }}>E'lon topilmadi</div>;

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <Link to="/auto-market" style={{ textDecoration: "none", fontWeight: 900 }}>
        ← Orqaga
      </Link>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "420px 1fr", gap: 14 }}>
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
          <img src={(car.images || [])[0]} alt="" style={{ width: "100%", height: 300, objectFit: "cover" }} />
        </div>

        <div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <StatusBadge status={car.status === "top" ? "top" : "new"} />
            <div style={{ fontSize: 22, fontWeight: 900 }}>{car.title}</div>
          </div>

          <div style={{ marginTop: 8 }}>
            <PriceTag price={car.price} currency={car.currency} />
          </div>

          <div style={{ marginTop: 10, opacity: 0.8 }}>
            Yil: <b>{car.year}</b> • Probeg: <b>{car.mileage} km</b> • {car.fuel} • {car.transmission}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button
              onClick={() => addToCompare(car)}
              style={{ border: "none", background: "#1677ff", color: "#fff", padding: "10px 14px", borderRadius: 12, fontWeight: 900, cursor: "pointer" }}
            >
              Solishtirishga qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
