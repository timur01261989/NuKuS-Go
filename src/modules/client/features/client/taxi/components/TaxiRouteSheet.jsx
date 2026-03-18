import React from "react";
import { Button, Divider, Input, Segmented } from "antd";
import {
  ClockCircleOutlined,
  CloseOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  PhoneOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { normalizeLatLng } from "../utils/latlng";

export default function TaxiRouteSheet({
  pickup,
  dest,
  openDestinationSearch,
  changeDestination,
  setAddStopOpen,
  setStep,
  waypoints,
  setWaypoints,
  message,
  navigate,
  tariffs,
  tariff,
  setTariff,
  durationMin,
  distanceKm,
  money,
  orderFor,
  setOrderFor,
  otherPhone,
  setOtherPhone,
  setScheduleOpen,
  comment,
  wishes,
  scheduledTime,
  handleOrderCreate,
  setShareOpen,
  tariffSectionRef,
  routeMeta,
}) {
  return (
    <div className="yg-sheet">
      <div className="yg-route-top">
        <div className="yg-route-row">
          <div className="yg-field-icon"><EnvironmentOutlined /></div>
          <div className="yg-route-txt">
            <div className="yg-field-label">Ketish nuqtasi</div>
            <div className="yg-field-value">{pickup.address || "—"}</div>
          </div>
          <Button size="small" className="yg-chip" onClick={openDestinationSearch}>
            {dest.address ? "Podyezd" : "Xarita"}
          </Button>
        </div>

        <div className="yg-route-row">
          <div className="yg-field-icon"><FlagOutlined /></div>
          <div className="yg-route-txt">
            <div className="yg-field-label">Borish nuqtasi</div>
            <div className="yg-field-value">{dest.address || "Belgilanmagan"}</div>
          </div>
          <Button size="small" className="yg-chip" onClick={changeDestination}>
            O'zgartirish
          </Button>
        </div>


        {routeMeta?.isFallback ? (
          <div style={{ marginTop: 10, borderRadius: 12, background: "#fff7e6", padding: "10px 12px", color: "#ad6800", fontSize: 12 }}>
            Yo‘l vaqtinchalik taxminiy marshrut bilan hisoblandi. Narx va vaqt keyinroq yangilanadi.
          </div>
        ) : null}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Oraliq bekatlar</div>
            <Button
              size="small"
              icon={<PlusOutlined style={{ fontSize: 16 }} />}
              className="yg-chip"
              onClick={() => {
                setAddStopOpen(true);
                setStep("stop_map");
              }}
              disabled={waypoints.length >= 3}
            />
          </div>
          {waypoints.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>Hozircha yo'q</div>
          ) : (
            <div style={{ marginTop: 6 }}>
              {waypoints.map((waypoint, idx) => (
                <div key={idx} className="yg-stop">
                  <div className="yg-stop-dot" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 650 }}>Bekat {idx + 1}</div>
                    <div className="yg-stop-addr">{waypoint.address || "—"}</div>
                  </div>
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    className="yg-chip"
                    onClick={() => setWaypoints((arr) => arr.filter((_, i) => i !== idx))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider style={{ margin: "12px 0" }} />

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <Button
            size="small"
            style={{ borderRadius: 999 }}
            icon={<CompassOutlined />}
            onClick={() => {
              const pickupPoint = normalizeLatLng(pickup?.latlng);
              const destPoint = normalizeLatLng(dest?.latlng);
              if (!pickupPoint || !destPoint) {
                message.info("Manzil tanlang");
                return;
              }
              navigate("/client/navigator", {
                state: {
                  pickup: pickupPoint,
                  dest: destPoint,
                  waypoints: (waypoints || []).map(normalizeLatLng).filter(Boolean),
                },
              });
            }}
          >
            Navigator
          </Button>
          <div className="yg-tab">Yetkazish xizmati</div>
        </div>

        <div className="yg-tariffs" ref={tariffSectionRef}>
          {tariffs.map((item) => (
            <button
              key={item.id}
              className={"yg-tariff " + (tariff.id === item.id ? "active" : "")}
              onClick={() => setTariff(item)}
            >
              <div style={{ fontSize: 11, opacity: 0.7 }}>{Math.max(1, Math.round(durationMin))} daq</div>
              <div style={{ fontWeight: 800, marginTop: 2 }}>{item.title}</div>
              <div style={{ fontWeight: 800, marginTop: 2 }}>{money((item.base + (distanceKm || 0) * item.perKm) * item.mult)}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 800 }}>Kim uchun buyurtma?</div>
            <Segmented
              size="small"
              value={orderFor}
              options={[
                { label: "O'zimga", value: "self" },
                { label: "Boshqaga", value: "other" },
              ]}
              onChange={(v) => setOrderFor(v)}
            />
          </div>
          {orderFor === "other" ? (
            <Input
              prefix={<PhoneOutlined />}
              value={otherPhone}
              onChange={(e) => setOtherPhone(e.target.value)}
              placeholder="U odamning telefon raqami"
            />
          ) : null}

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Button
              icon={<ClockCircleOutlined />}
              onClick={() => setScheduleOpen(true)}
              style={{ flex: 1, borderRadius: 12 }}
            >
              Rejalash
            </Button>
          </div>

          {(comment || wishes.ac || wishes.trunk || wishes.childSeat || wishes.smoking === "yes" || scheduledTime) ? (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              {scheduledTime ? <>🕒 {new Date(scheduledTime).toLocaleString()}</> : null}
              {comment ? <div style={{ marginTop: 4 }}>📒 {comment}</div> : null}
            </div>
          ) : null}
        </div>

        <div className="yg-bottom-row" style={{ marginTop: 14 }}>
          <Button className="yg-yellow" type="primary" onClick={handleOrderCreate}>
            Buyurtma berish
          </Button>
          <Button className="yg-round" icon={<ShareAltOutlined />} onClick={() => setShareOpen(true)} />
        </div>
      </div>
    </div>
  );
}
