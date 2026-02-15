import React, { useMemo, useState } from "react";
import { Button, Card, Col, Divider, message, Row, Select, Tag, Typography } from "antd";
import { CheckCircleOutlined, EnvironmentFilled } from "@ant-design/icons";
import dayjs from "dayjs";
import { IntercityProvider, PRESET_CITIES, useIntercity } from "./context/IntercityContext";
import IntercityMap from "./map/IntercityMap";
import DatePickerSheet from "./components/Filters/DatePickerSheet";
import PassengerCount from "./components/Filters/PassengerCount";
import SeatSelector from "./components/Seats/SeatSelector";
import DriverOfferList from "./components/Drivers/DriverOfferList";
import intercityApi from "./services/intercityApi";
import { useRoutePolyline } from "./map/useRoutePolyline";

const { Title, Text } = Typography;

function InnerPage() {
  const {
    fromCity,
    setFromCity,
    toCity,
    setToCity,
    travelDate,
    passengers,
    selectedSeats,
    selectedOffer,
  } = useIntercity();

  const [submitting, setSubmitting] = useState(false);

  const { distanceKm, durationMin } = useRoutePolyline(fromCity?.latlng, toCity?.latlng);

  const canSubmit = useMemo(() => {
    if (!fromCity || !toCity) return false;
    if (!travelDate) return false;
    if (!selectedOffer) return false;
    // seats: agar xohlasangiz majburiy qiling, hozir ixtiyoriy
    return true;
  }, [fromCity, toCity, travelDate, selectedOffer]);

  const onSubmit = async () => {
    if (!selectedOffer) {
      message.warning("Avval haydovchini tanlang");
      return;
    }
    if (selectedSeats.length > passengers) {
      message.error("O'rindiqlar soni yo'lovchi sonidan oshib ketdi");
      return;
    }

    setSubmitting(true);
    const hide = message.loading("So'rov yuborilmoqda...", 0);

    try {
      const data = await intercityApi.requestBooking({
        offer_id: selectedOffer.id,
        seats: selectedSeats,
        passengers,
        date: travelDate.format("YYYY-MM-DD"),
        from_city: fromCity.title,
        to_city: toCity.title,
      });

      const ok = data?.ok ?? data?.success ?? !!data?.id;
      if (ok) {
        message.success("So'rov yuborildi! Haydovchi tasdiqlashi kerak.");
      } else {
        message.info("So'rov yuborildi (javob formati boshqacha bo'lishi mumkin).");
      }
    } catch (e) {
      console.error(e);
      message.error("So'rov yuborishda xatolik");
    } finally {
      hide();
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", paddingBottom: 30 }}>
      <div style={{ padding: "0 6px" }}>
        <Title level={4} style={{ margin: "12px 0 6px" }}>
          Viloyatlararo taksi
        </Title>
        <Text type="secondary">Reys tanlang, o'rindiq belgilang va haydovchiga so'rov yuboring.</Text>
      </div>

      <div style={{ padding: 10 }}>
        <IntercityMap />
      </div>

      <div style={{ padding: "0 10px" }}>
        <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
          <Row gutter={[10, 10]}>
            <Col xs={24} md={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Qayerdan
              </Text>
              <Select
                value={fromCity?.id}
                onChange={(id) => setFromCity(PRESET_CITIES.find((c) => c.id === id))}
                style={{ width: "100%", marginTop: 6 }}
                size="large"
                options={PRESET_CITIES.map((c) => ({ value: c.id, label: c.title }))}
              />
            </Col>

            <Col xs={24} md={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Qayerga
              </Text>
              <Select
                value={toCity?.id}
                onChange={(id) => setToCity(PRESET_CITIES.find((c) => c.id === id))}
                style={{ width: "100%", marginTop: 6 }}
                size="large"
                options={PRESET_CITIES.map((c) => ({ value: c.id, label: c.title }))}
              />
            </Col>
          </Row>

          <Divider style={{ margin: "14px 0" }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <DatePickerSheet />
            <PassengerCount />
            <DriverOfferList />
          </div>

          <Divider style={{ margin: "14px 0" }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Tag icon={<EnvironmentFilled />} color="blue" style={{ borderRadius: 999, padding: "6px 10px" }}>
              Masofa: {Math.round(distanceKm)} km
            </Tag>
            <Tag color="gold" style={{ borderRadius: 999, padding: "6px 10px" }}>
              Taxminiy: {Math.max(1, Math.round(durationMin))} daqiqa
            </Tag>
            <Tag color="green" style={{ borderRadius: 999, padding: "6px 10px" }}>
              Sana: {travelDate?.format("DD MMM")}
            </Tag>
          </div>

          <div style={{ marginTop: 14 }}>
            <SeatSelector busySeats={selectedOffer?.busy_seats || []} />
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "grid" }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Tanlangan haydovchi
              </Text>
              <Text style={{ fontWeight: 800 }}>
                {selectedOffer ? selectedOffer.driver_name || "Haydovchi" : "Tanlanmagan"}
              </Text>
            </div>

            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={!canSubmit}
              loading={submitting}
              onClick={onSubmit}
              style={{ height: 46, borderRadius: 14, minWidth: 180 }}
            >
              So'rov yuborish
            </Button>
          </div>
        </Card>

        <div style={{ padding: "10px 2px", color: "#888", fontSize: 12 }}>
          Eslatma: Bu modul backenddagi <code>/api/intercity</code> action'lariga tayangan. Agar sizda endpoint nomi boshqacha
          bo'lsa, <code>services/intercityApi.js</code> faylini moslab qo'ying.
        </div>
      </div>
    </div>
  );
}

export default function ClientIntercityPage() {
  return (
    <IntercityProvider>
      <InnerPage />
    </IntercityProvider>
  );
}
