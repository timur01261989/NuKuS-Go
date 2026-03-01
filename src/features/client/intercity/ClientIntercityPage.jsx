import React, { useMemo, useState } from "react";
import { Card, Button, Typography, Divider, Modal, InputNumber, message, Tag } from "antd";
import { EnvironmentOutlined, SearchOutlined } from "@ant-design/icons";
import RegionDistrictSelect from "../../../components/RegionDistrictSelect";
import { getRegionById, formatRegionDistrict } from "../../../constants/uzLocations";
import IntercityMap from "./map/IntercityMap";
import { listInterProvTrips, createSeatRequest } from "./services/intercitySupabase";
import { useAuth } from "../../../shared/auth/AuthProvider";

export default function ClientIntercityPage() {
  const { user } = useAuth();
  const clientUserId = user?.id || null;

  const [fromRegionId, setFromRegionId] = useState(null);
  const [fromDistrict, setFromDistrict] = useState("");
  const [toRegionId, setToRegionId] = useState(null);
  const [toDistrict, setToDistrict] = useState("");

  const [loading, setLoading] = useState(false);
  const [trips, setTrips] = useState([]);

  const [bookOpen, setBookOpen] = useState(false);
  const [bookTrip, setBookTrip] = useState(null);
  const [bookSeats, setBookSeats] = useState(1);

  const fromRegion = useMemo(() => getRegionById(fromRegionId), [fromRegionId]);
  const toRegion = useMemo(() => getRegionById(toRegionId), [toRegionId]);

  const mapCenter = useMemo(() => [42.4602, 59.6156], []);
  const canSearch = Boolean(fromRegionId && toRegionId);

  const runSearch = async () => {
    if (!canSearch) return message.warning("Avval viloyatlarni tanlang");
    setLoading(true);
    try {
      const data = await listInterProvTrips({
        fromRegionName: fromRegion?.name || "",
        toRegionName: toRegion?.name || "",
        fromDistrict: fromDistrict || "",
        toDistrict: toDistrict || "",
        limit: 80,
      });
      setTrips(data);
      if (!data.length) message.info("Mos reys topilmadi");
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  const openBooking = (trip) => {
    setBookTrip(trip);
    setBookSeats(1);
    setBookOpen(true);
  };

  const confirmBooking = async () => {
    if (!bookTrip) return;
    if (!clientUserId) return message.error("Kirish qilinmagan");
    setLoading(true);
    try {
      await createSeatRequest({ tripId: bookTrip.id, clientUserId, seats: Math.max(1, Number(bookSeats || 1)) });
      message.success("So‘rov yuborildi");
      setBookOpen(false);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "So‘rov yuborilmadi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 14 }}>
      <Typography.Title level={4} style={{ margin: 0 }}>Viloyatlar aro</Typography.Title>

      <div style={{ marginTop: 12 }}>
        <Card bodyStyle={{ padding: 14 }}>
          <Typography.Text strong>Qayerdan / Qayerga</Typography.Text>

          <div style={{ marginTop: 10 }}>
            <RegionDistrictSelect
              regionId={fromRegionId}
              district={fromDistrict}
              onRegionChange={(id) => { setFromRegionId(id); setFromDistrict(""); }}
              onDistrictChange={(d) => setFromDistrict(d)}
              allowEmptyDistrict
              regionPlaceholder="Qayerdan (viloyat)"
              districtPlaceholder="Qayerdan (tuman - ixtiyoriy)"
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <RegionDistrictSelect
              regionId={toRegionId}
              district={toDistrict}
              onRegionChange={(id) => { setToRegionId(id); setToDistrict(""); }}
              onDistrictChange={(d) => setToDistrict(d)}
              allowEmptyDistrict
              regionPlaceholder="Qayerga (viloyat)"
              districtPlaceholder="Qayerga (tuman - ixtiyoriy)"
            />
          </div>

          <Divider style={{ margin: "14px 0" }} />

          <Button type="primary" icon={<SearchOutlined />} loading={loading} onClick={runSearch} disabled={!canSearch} block>
            Reys izlash
          </Button>
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <Card bodyStyle={{ padding: 0 }}>
          <div style={{ height: 160, overflow: "hidden", borderRadius: 10 }}>
            <IntercityMap center={mapCenter} small />
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <Typography.Text strong>Topilgan reyslar</Typography.Text>
        <div style={{ marginTop: 10 }}>
          {trips.map((t) => {
            const depart = t?.depart_at ? new Date(t.depart_at) : null;
            const departText = depart ? depart.toLocaleString() : "—";
            const fromText = formatRegionDistrict(t.from_region, t.from_district);
            const toText = formatRegionDistrict(t.to_region, t.to_district);
            return (
              <Card key={t.id} style={{ marginBottom: 12 }} bodyStyle={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <Typography.Text strong style={{ fontSize: 16 }}>{fromText} → {toText}</Typography.Text>
                    <div style={{ marginTop: 4, color: "#6b7280" }}><EnvironmentOutlined /> <span style={{ marginLeft: 6 }}>{departText}</span></div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Tag color="blue">{t?.seats_available ?? "—"} o‘rin</Tag>
                      <Tag color="gold">{t?.price_per_seat ?? "—"} so‘m</Tag>
                      {t?.parcel_enabled ? <Tag color="green">Posilka</Tag> : null}
                      {t?.status ? <Tag>{t.status}</Tag> : null}
                    </div>
                    {t?.notes ? <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}><Typography.Text type="secondary">{t.notes}</Typography.Text></div> : null}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <Button type="primary" onClick={() => openBooking(t)}>So‘rov yuborish</Button>
                    {t?.driver_name ? <Typography.Text type="secondary">{t.driver_name}</Typography.Text> : null}
                  </div>
                </div>
              </Card>
            );
          })}
          {!trips.length ? (
            <Card bodyStyle={{ padding: 14 }}>
              <Typography.Text type="secondary">Reys izlash uchun viloyatlarni tanlang.</Typography.Text>
            </Card>
          ) : null}
        </div>
      </div>

      <Modal open={bookOpen} title="Reysga so‘rov yuborish" onCancel={() => setBookOpen(false)} onOk={confirmBooking}
             okText="Yuborish" cancelText="Bekor qilish" confirmLoading={loading}>
        <div style={{ display: "grid", gap: 10 }}>
          <Typography.Text>
            {bookTrip ? `${formatRegionDistrict(bookTrip.from_region, bookTrip.from_district)} → ${formatRegionDistrict(bookTrip.to_region, bookTrip.to_district)}` : ""}
          </Typography.Text>
          <div>
            <Typography.Text type="secondary">O‘rinlar soni</Typography.Text>
            <div style={{ marginTop: 6 }}>
              <InputNumber min={1} max={8} value={bookSeats} onChange={setBookSeats} style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
