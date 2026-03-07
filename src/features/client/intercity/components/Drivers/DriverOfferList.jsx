import React, { useEffect, useMemo, useState } from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Button, Drawer, Input, message, Skeleton, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useIntercity } from "../../context/IntercityContext";
import DriverCard from "./DriverCard";
import intercityApi from "../../services/intercityApi";

const { Text } = Typography;

export default function DriverOfferList() {
  const { fromCity, toCity, travelDate, passengers, selectedOffer, setSelectedOffer } = useIntercity();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await intercityApi.listOffers({
        from_city: fromCity?.title,
        to_city: toCity?.title,
        date: travelDate?.format("YYYY-MM-DD"),
        passengers,
      });
      setOffers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      message.error(cp("Reyslar ro'yxatini olishda xatolik"));
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return offers;
    return offers.filter((x) => {
      const s = `${x.driver_name || ""} ${x.car_model || ""} ${x.car_plate || ""}`.toLowerCase();
      return s.includes(qq);
    });
  }, [offers, q]);

  return (
    <>
      <Button
        icon={<SearchOutlined />}
        onClick={() => setOpen(true)}
        style={{ height: 46, borderRadius: 14, boxShadow: "0 6px 16px rgba(0,0,0,0.06)" }}
      >
        Reyslarni ko'rish
      </Button>

      <Drawer
        title=cp("Haydovchilar reyslari")
        placement="bottom"
        height="86vh"
        open={open}
        onClose={() => setOpen(false)}
        bodyStyle={{ paddingBottom: 18 }}
      >
        <div style={{ display: "grid", gap: 12 }}>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder=cp("Haydovchi / mashina bo'yicha qidirish...")
            style={{ height: 46, borderRadius: 14 }}
            allowClear
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {fromCity?.title} ➝ {toCity?.title} • {travelDate?.format("DD MMM")} • {passengers} yo'lovchi
            </Text>
            <Button onClick={load} disabled={loading} style={{ borderRadius: 12 }}>
              Yangilash
            </Button>
          </div>

          {loading ? (
            <div style={{ display: "grid", gap: 10 }}>
              <Skeleton active />
              <Skeleton active />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#888" }}>
              Hozircha mos reyslar topilmadi.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map((offer) => (
                <DriverCard
                  key={offer.id || `${offer.driver_id}-${offer.car_plate}-${offer.price}`}
                  offer={offer}
                  selected={selectedOffer?.id === offer.id}
                  onSelect={() => {
                    setSelectedOffer(offer);
                    message.success(cp("Haydovchi tanlandi"));
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}