import React, { useEffect, useMemo, useState } from "react";
import { Drawer, Button, Space, Typography, Input, Switch, Radio, Divider } from "antd";
import { useDistrict } from "../../context/DistrictContext"; // 1. Context import qilindi
import { useClientText, formatClientMoney } from "../../../shared/i18n_clientLocalize";

/**
 * RequestTripDrawer.jsx
 * -------------------------------------------------------
 * Client reysga so‘rov yuboradi.
 * - pitak: oddiy so‘rov
 * - door-to-door: pickup/dropoff manzil + full salon + eltish
 * * QO'SHILGAN FUNKSIYALAR ("Yagona Reys" tizimi uchun):
 * - Narx shaffofligi (Price Transparency) va Hisoblagich
 * - {cp("To'lov turi") || "To'lov turi"} (Naqd yoki Karta)
 * - Pochta (Posilka) uchun vazn toifalari
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
  // 2. Contextdan kerakli state'larni olish
  const { seatState, estimatedPrice } = useDistrict();
  const { cp, language } = useClientText();

  // Eski state'lar
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [wantsFullSalon, setWantsFullSalon] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // 3. Yangi qo'shilgan state'lar
  const [paymentMethod, setPaymentMethod] = useState("cash"); // 'cash' yoki 'card'
  const [weightCategory, setWeightCategory] = useState("light"); // 'light', 'medium', 'heavy'

  useEffect(() => {
    setPickupAddress(defaultPickupAddress || "");
    setDropoffAddress(defaultDropoffAddress || "");
    setWantsFullSalon(!!allowFullSalonDefault);
    setIsDelivery(false);
    setDeliveryNotes("");
    
    // Yangi state'larni tozalash
    setPaymentMethod("cash");
    setWeightCategory("light");
  }, [trip?.id, defaultPickupAddress, defaultDropoffAddress, allowFullSalonDefault]);

  const door = trip?.tariff === "door";

  const canSubmit = useMemo(() => {
    if (!trip) return false;
    if (!door) return true;
    // pickup address bo‘lsa yaxshi, lekin majburiy emas deb so‘ragan — shuning uchun to‘siq qo‘ymaymiz
    return true;
  }, [trip, door]);

  // 4. Narxni hisoblash (Kalkulyator)
  const priceDetails = useMemo(() => {
    // Agar trip.price bo'lmasa, contextdagi estimatedPrice ni olamiz
    const basePrice = trip?.price || estimatedPrice || 0; 
    
    // Tanlangan o'rindiqlar soni (Butun salon bo'lsa 4 ta, yo'qsa tanlanganlari, hech nima bo'lmasa 1 ta)
    const selectedSeatsCount = wantsFullSalon ? 4 : (seatState?.selected?.size || 1);

    // Pochta narxi (yengil - 50%, o'rtacha - 75%, og'ir - 100% bitta o'rindiq puli)
    let parcelPrice = 0;
    if (isDelivery) {
      if (weightCategory === "light") parcelPrice = basePrice * 0.5;
      else if (weightCategory === "medium") parcelPrice = basePrice * 0.75;
      else parcelPrice = basePrice;
    }

    // Umumiy summa (Yoki yo'lovchi narxi, yoki pochta narxi)
    // Agar odam o'zi ketmasdan faqat pochta bersa, faqat pochta puli olinadi
    const finalPrice = isDelivery ? parcelPrice : (selectedSeatsCount * basePrice);

    return { basePrice, selectedSeatsCount, parcelPrice, finalPrice };
  }, [trip?.price, estimatedPrice, wantsFullSalon, seatState?.selected?.size, isDelivery, weightCategory]);

  return (
    <Drawer
      title="So‘rov yuborish"
      placement="bottom"
      // Qo'shilgan ma'lumotlar sig'ishi uchun balandlik (height) kattalashtirildi
      height={door ? 650 : 450} 
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
                    <Switch checked={wantsFullSalon} onChange={setWantsFullSalon} disabled={isDelivery} />
                  </Space>
                </div>
              )}

              {trip.has_delivery && (
                <div style={{ marginTop: 12 }}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
                    <Typography.Text style={{ fontWeight: 600 }}>Eltish (Pochta / Posilka)</Typography.Text>
                    <Switch 
                      checked={isDelivery} 
                      onChange={(val) => {
                        setIsDelivery(val);
                        if (val) setWantsFullSalon(false); // Pochta bo'lsa butun salon o'chadi
                      }} 
                    />
                  </Space>
                  
                  {isDelivery && (
                    <div style={{ marginTop: 12, padding: "10px", background: "#f5f5f5", borderRadius: 8 }}>
                      <Typography.Text style={{ fontSize: 12, opacity: 0.7, display: "block", marginBottom: 6 }}>
                        {cp("Pochta vazni (narx shunga qarab belgilanadi)") || "Pochta vazni (narx shunga qarab belgilanadi)"}
                      </Typography.Text>
                      <Radio.Group 
                        value={weightCategory} 
                        onChange={(e) => setWeightCategory(e.target.value)}
                        style={{ display: "flex", flexDirection: "column", gap: 8 }}
                      >
                        <Radio value="light">{cp("Hujjat / Kichik paket (Arzon)") || "Hujjat / Kichik paket (Arzon)"}</Radio>
                        <Radio value="medium">{cp("O'rtacha sumka") || "O'rtacha sumka"}</Radio>
                        <Radio value="heavy">{cp("Og'ir yuk (Bir o'rindiq narxida)") || "Og'ir yuk (Bir o'rindiq narxida)"}</Radio>
                      </Radio.Group>

                      <div style={{ marginTop: 12 }}>
                        <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>{cp("Eltish izohi") || "Eltish izohi"}</Typography.Text>
                        <Input.TextArea 
                          value={deliveryNotes} 
                          onChange={(e) => setDeliveryNotes(e.target.value)} 
                          rows={2} 
                          placeholder={cp("Qabul qiluvchi raqami va buyum haqida...") || "Qabul qiluvchi raqami va buyum haqida..."} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 5. {cp("To'lov turi") || "To'lov turi"} (Naqd / Karta) qo'shildi */}
          <Divider style={{ margin: "16px 0 8px 0" }} />
          <div>
            <Typography.Text style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>{cp("To'lov turi") || "To'lov turi"}</Typography.Text>
            <Radio.Group 
              value={paymentMethod} 
              onChange={(e) => setPaymentMethod(e.target.value)}
              buttonStyle="solid"
              style={{ width: "100%", display: "flex" }}
            >
              <Radio.Button value="cash" style={{ flex: 1, textAlign: "center", borderRadius: "8px 0 0 8px" }}>💵 {cp("Naqd pul") || "Naqd pul"}</Radio.Button>
              <Radio.Button value="card" style={{ flex: 1, textAlign: "center", borderRadius: "0 8px 8px 0" }}>💳 {cp("Karta (Ilovadan)") || "Karta (Ilovadan)"}</Radio.Button>
            </Radio.Group>
          </div>

          {/* 6. Narx shaffofligi (Total Price Breakdown) */}
          <div style={{ marginTop: 16, padding: "12px", background: "rgba(82, 196, 26, 0.1)", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Typography.Text style={{ color: "#555" }}>
                {isDelivery ? (cp("Pochta xizmati:") || "Pochta xizmati:") : `${cp("Yo'l haqi") || "Yo'l haqi"} (${priceDetails.selectedSeatsCount} ${cp("ta")} ${cp("joy") || "joy"}):`}
              </Typography.Text>
              <Typography.Text style={{ fontWeight: 600 }}>
                {formatClientMoney(language, priceDetails.finalPrice)}
              </Typography.Text>
            </div>
            <Typography.Text style={{ fontSize: 11, color: "#888", display: "block", marginTop: 4 }}>
              * {cp("Yakuniy narx haydovchi qabul qilganidan so'ng tasdiqlanadi.") || "Yakuniy narx haydovchi qabul qilganidan so'ng tasdiqlanadi."}
            </Typography.Text>
          </div>

          <div style={{ marginTop: 18 }}>
            <Button
              type="primary"
              disabled={!canSubmit}
              onClick={() =>
                // 7. onSubmit ga yangi state'lar ham qo'shib yuborildi
                onSubmit?.({
                  pickup_address: pickupAddress,
                  dropoff_address: dropoffAddress,
                  wants_full_salon: wantsFullSalon,
                  is_delivery: isDelivery,
                  delivery_notes: deliveryNotes,
                  weight_category: isDelivery ? weightCategory : null,
                  payment_method: paymentMethod,
                  final_price: priceDetails.finalPrice
                })
              }
              style={{ width: "100%", borderRadius: 16, height: 44 }}
            >
              {cp("Buyurtma berish")}
            </Button>
            <Button onClick={onClose} style={{ width: "100%", marginTop: 10, borderRadius: 16, height: 44 }}>
              {cp("Bekor qilish")}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}