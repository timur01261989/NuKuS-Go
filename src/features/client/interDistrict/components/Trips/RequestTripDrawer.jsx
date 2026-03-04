import React, { useEffect, useMemo, useState } from "react";
import { Drawer, Button, Space, Typography, Input, Switch } from "antd";

/**
 * RequestTripDrawer.jsx
 * -------------------------------------------------------
 * Client reysga so‘rov yuboradi.
 * - pitak: oddiy so‘rov
 * - door-to-door: pickup/dropoff manzil + full salon + eltish
 */
export default function RequestTripDrawer({
  open,
  onClose,
  trip,
  defaultPickupAddress,
  defaultDropoffAddress,
  onSubmit,
  allowFullSalonDefault = false,
}) {
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [wantsFullSalon, setWantsFullSalon] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  useEffect(() => {
    setPickupAddress(defaultPickupAddress || "");
    setDropoffAddress(defaultDropoffAddress || "");
    setWantsFullSalon(!!allowFullSalonDefault);
    setIsDelivery(false);
    setDeliveryNotes("");
  }, [trip?.id, defaultPickupAddress, defaultDropoffAddress, allowFullSalonDefault]);

  const door = trip?.tariff === "door";

  const canSubmit = useMemo(() => {
    if (!trip) return false;
    if (!door) return true;
    // pickup address bo‘lsa yaxshi, lekin majburiy emas deb so‘ragan — shuning uchun to‘siq qo‘ymaymiz
    return true;
  }, [trip, door]);

  return (
    <Drawer
      title="So‘rov yuborish"
      placement="bottom"
      height={door ? 420 : 240}
      open={open}
      onClose={onClose}
    >
      {!trip ? (
        <Typography.Text>Reys tanlanmagan.</Typography.Text>
      ) : (
        <>
          <Typography.Text style={{ fontWeight: 700 }}>
            {trip.from_district} → {trip.to_district}
          </Typography.Text>
          <div style={{ marginTop: 8, color: "#666", fontSize: 12 }}>
            Ketish: {new Date(trip.depart_at).toLocaleString()}
          </div>

          {door && (
            <>
              <div style={{ marginTop: 14 }}>
                <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Qaerdan (manzil)</Typography.Text>
                <Input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="Ixtiyoriy" />
              </div>

              <div style={{ marginTop: 10 }}>
                <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Qaerga (manzil)</Typography.Text>
                <Input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="Ixtiyoriy (majburiy emas)" />
              </div>

              {trip.allow_full_salon && (
                <div style={{ marginTop: 12 }}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
                    <Typography.Text style={{ fontWeight: 600 }}>Butun salon</Typography.Text>
                    <Switch checked={wantsFullSalon} onChange={setWantsFullSalon} />
                  </Space>
                </div>
              )}

              {trip.has_delivery && (
                <div style={{ marginTop: 12 }}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
                    <Typography.Text style={{ fontWeight: 600 }}>Eltish (posilka)</Typography.Text>
                    <Switch checked={isDelivery} onChange={setIsDelivery} />
                  </Space>
                  {isDelivery && (
                    <div style={{ marginTop: 8 }}>
                      <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Eltish izohi</Typography.Text>
                      <Input.TextArea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} rows={3} placeholder="Masalan: hujjat, kichik quti, vazn..." />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: 18 }}>
            <Button
              type="primary"
              disabled={!canSubmit}
              onClick={() =>
                onSubmit?.({
                  pickup_address: pickupAddress,
                  dropoff_address: dropoffAddress,
                  wants_full_salon: wantsFullSalon,
                  is_delivery: isDelivery,
                  delivery_notes: deliveryNotes,
                })
              }
              style={{ width: "100%", borderRadius: 16, height: 44 }}
            >
              Yuborish
            </Button>
            <Button onClick={onClose} style={{ width: "100%", marginTop: 10, borderRadius: 16, height: 44 }}>
              Bekor qilish
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}
