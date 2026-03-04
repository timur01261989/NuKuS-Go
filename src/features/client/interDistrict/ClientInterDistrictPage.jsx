import React, { useEffect, useMemo, useState } from "react";
import { Button, Divider, Drawer, message, Typography } from "antd";
import DistrictHeader from "./components/Header/DistrictHeader";
import DistrictList from "./components/Selection/DistrictList";
import DepartureTime from "./components/Selection/DepartureTime";
import CarSeatSchema from "./components/Seats/CarSeatSchema";
import SeatLegend from "./components/Seats/SeatLegend";
import FilterBar from "./components/Drivers/FilterBar";
import DriverOfferCard from "./components/Drivers/DriverOfferCard";
import TripCard from "./components/Trips/TripCard";
import RequestTripDrawer from "./components/Trips/RequestTripDrawer";
import DistrictMap from "./map/DistrictMap";
import { DistrictProvider, useDistrict } from "./context/DistrictContext";
import { useDistrictRoute } from "./map/useDistrictRoute";
import { listDistrictOffers, createInterDistrictOrder } from "./services/districtApi";
import { searchTrips } from "@/features/shared/interDistrictTrips";

/**
 * ClientInterDistrictPage.jsx
 * -------------------------------------------------------
 * Kirish nuqtasi (Main Entry).
 * Flow:
 * 1) Tuman tanlash
 * 2) Vaqt, o‘rindiq, filter
 * 3) Takliflar (haydovchi) ro‘yxati
 * 4) Buyurtma yaratish
 */

function Inner({ onBack }) {
  const {
    region,
    fromDistrict,
    toDistrict,
    departureTime,
    seatState,
    routeInfo,
    setRouteInfo,
    filters,
  } = useDistrict();

  const { from, to, distanceKm, durationMin, price } = useDistrictRoute(fromDistrict, toDistrict);

  const [loadingOffers, setLoadingOffers] = useState(false);
  const [offers, setOffers] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // NEW: Driver yaratgan reyslar (district_trips)
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [trips, setTrips] = useState([]);
  const [reqDrawerOpen, setReqDrawerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    setRouteInfo({ distanceKm, durationMin, price });
  }, [distanceKm, durationMin, price, setRouteInfo]);

  const seatCount = useMemo(() => seatState.selected.size || 1, [seatState.selected]);

  useEffect(() => {
    if (!toDistrict || !distanceKm) {
      setOffers([]);
      return;
    }
    (async () => {
      setLoadingOffers(true);
      try {
        const list = await listDistrictOffers({
          fromDistrict,
          toDistrict,
          distanceKm,
          filters,
        });
        setOffers(list);
      } finally {
        setLoadingOffers(false);
      }
    })();
  }, [fromDistrict, toDistrict, distanceKm, filters.ac, filters.trunk]);

  const doSearchTrips = async () => {
    setLoadingTrips(true);
    try {
      // Basic search by region/from/to + optional depart window
      const payload = {
        region: region || null,
        from_district: fromDistrict || null,
        to_district: toDistrict || null,
        // If you add client-side mode toggle later:
        mode: null,
        depart_from: departureTime ? new Date(departureTime).toISOString() : null,
        depart_to: null,
        filters,
      };

      const { data, error } = await searchTrips(payload);
      if (error) throw error;
      setTrips(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) {
        message.info("Reys topilmadi");
      }
    } catch (e) {
      console.warn(e);
      message.error(e?.message || "Reys izlashda xato");
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  const handleCreate = async (offer) => {
    if (!toDistrict) return message.error("Tuman tanlang");
    if (!distanceKm) return message.error("Masofa aniqlanmadi");
    const p = Math.round(price || 0);
    if (!p) return message.error("Narx hisoblanmadi");

    const payload = {
      fromDistrict,
      toDistrict,
      seats: seatCount,
      price: p,
      distance_km: distanceKm,
      duration_min: durationMin,
      departureTime,
      selectedOfferId: offer?.id || null,
      filters,
    };

    const hide = message.loading("Buyurtma yuborilmoqda...", 0);
    try {
      const res = await createInterDistrictOrder(payload);
      const id = res?.id || res?.data?.id || res?.orderId;
      message.success(id ? `Buyurtma yaratildi (#${id})` : "Buyurtma yaratildi");
      setDrawerOpen(true);
    } catch (e) {
      message.error(e?.message || "Xatolik: buyurtma yuborilmadi");
    } finally {
      hide();
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", paddingBottom: 24 }}>
      <DistrictHeader onBack={onBack} />

      <div style={{ padding: "0 14px" }}>
        <DistrictMap from={from} to={to} />

        <div style={{ marginTop: 12 }}>
          <DistrictList />
        </div>

        <div style={{ marginTop: 12 }}>
          <DepartureTime />
        </div>

        <div style={{ marginTop: 12 }}>
          <CarSeatSchema />
        </div>

        <div style={{ marginTop: 12 }}>
          <SeatLegend />
        </div>

        <div style={{ marginTop: 12 }}>
          <FilterBar />
        </div>

        <Divider />

        <Typography.Title level={5} style={{ margin: "6px 0 10px" }}>
          Haydovchi takliflari
        </Typography.Title>

        {loadingOffers ? (
          <div style={{ color: "#666" }}>Yuklanmoqda...</div>
        ) : offers.length ? (
          offers.map((o) => <DriverOfferCard key={o.id} offer={o} onSelect={handleCreate} />)
        ) : (
          <div style={{ color: "#666" }}>
            Tuman tanlang — haydovchi takliflari shu yerda ko‘rinadi.
            <div style={{ marginTop: 12 }}>
              <Button
                type="primary"
                disabled={!toDistrict || !price}
                onClick={() => handleCreate(null)}
                style={{ width: "100%", borderRadius: 16, height: 44 }}
              >
                Buyurtma berish
              </Button>
            </div>
          </div>
        )}
      </div>

      <Drawer
        title="Buyurtma holati"
        placement="bottom"
        height={220}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Typography.Text>
          Buyurtma yuborildi. Backend tarafdan statuslar qo‘shilgach, bu yerda real holat ko‘rsatiladi.
        </Typography.Text>
        <div style={{ marginTop: 12 }}>
          <Button danger onClick={() => setDrawerOpen(false)} style={{ borderRadius: 14 }}>
            Yopish
          </Button>
        </div>
      </Drawer>
    </div>
  );
}

export default function ClientInterDistrictPage(props) {
  return (
    <DistrictProvider>
      <Inner {...props} />
    </DistrictProvider>
  );
}//a