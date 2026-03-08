import { useClientText } from "../shared/i18n_clientLocalize";
import React, { useMemo, useState } from "react";
import { Button, Drawer, Input, List, Spin, Tag, Typography } from "antd";
import {
  ArrowLeftOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  StarFilled,
} from "@ant-design/icons";
import { haversineKm } from "../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../shared/geo/nominatim";


/**
 * TaxiSearchSheet
 * - "Qaerga borasiz?" qidiruv oynasi (bottom Drawer)
 * - Pickup va Destination maydonlari
 * - Nominatim natijalari + saved places
 *
 * NOTE: Qidiruv (fetch/debounce/abort) mantiqi ClientTaxiPage’da bo‘ladi.
 */
export default function TaxiSearchSheet({
  searchOpen,
  setSearchOpen,
  setStep,

  pickupSearchText,
  setPickupSearchText,
  destSearchText,
  setDestSearchText,

  // current resolved pickup address for display
  pickupAddress,

  searchLoading,
  searchResults,

  savedPlaces,

  setDestFromSuggestion,
  setPickupFromSuggestion,

  openPickupMapEdit,
  openDestMapSelect,
}) {
  const [activeField, setActiveField] = useState("dest"); // 'pickup' | 'dest'

  const listData = useMemo(() => {
    const res = Array.isArray(searchResults) ? searchResults : [];
    const saved = Array.isArray(savedPlaces) ? savedPlaces : [];
    return { res, saved };
  }, [searchResults, savedPlaces]);

  const handlePick = (item) => {
    if (!item) return;
    if (activeField === "pickup") setPickupFromSuggestion?.(item);
    else setDestFromSuggestion?.(item);
  };

  return (
    <Drawer
      open={!!searchOpen}
      placement="bottom"
      height="88vh"
      onClose={() => {
        setSearchOpen?.(false);
        setStep?.("main");
      }}
      bodyStyle={{ padding: 0 }}
      title={null}
      closeIcon={null}
    >
      <div className="yg-search-top">
        <div className="yg-search-head">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              setSearchOpen?.(false);
              setStep?.("main");
            }}
          />
          <div style={{ fontWeight: 800 }}>Qaerga borasiz?</div>
          <Button type="text" icon={<CloseOutlined />} onClick={() => setSearchOpen?.(false)} />
        </div>

        <div className="yg-search-fields">
          {/* PICKUP */}
          <div className="yg-search-field" onClick={() => setActiveField("pickup")}>
            <div className="yg-search-ic">
              <EnvironmentOutlined />
            </div>
            <div style={{ flex: 1 }}>
              <div className="yg-search-cap">Yo‘lovchini olish nuqtasi</div>
              <Input
                value={pickupSearchText}
                onChange={(e) => setPickupSearchText?.(e.target.value)}
                onFocus={() => setActiveField("pickup")}
                placeholder={pickupAddress || "Manzil kiriting..."}
                bordered={false}
              />
            </div>
            <Button
              size="small"
              className="yg-chip"
              onClick={(e) => {
                e.stopPropagation();
                openPickupMapEdit?.();
              }}
            >
              Xarita
            </Button>
          </div>

          {/* DESTINATION */}
          <div className="yg-search-field" onClick={() => setActiveField("dest")}>
            <div className="yg-search-ic">
              <FlagOutlined />
            </div>
            <div style={{ flex: 1 }}>
              <div className="yg-search-cap">Yakuniy manzil</div>
              <Input
                value={destSearchText}
                onChange={(e) => setDestSearchText?.(e.target.value)}
                onFocus={() => setActiveField("dest")}
                placeholder="Qaerga borasiz?"
                bordered={false}
              />
            </div>
            <Button
              size="small"
              className="yg-chip"
              onClick={(e) => {
                e.stopPropagation();
                openDestMapSelect?.();
              }}
            >
              Xarita
            </Button>
          </div>

          <div style={{ padding: "0 18px 10px", display: "flex", gap: 8 }}>
            <Tag color={activeField === "pickup" ? "blue" : "default"} style={{ margin: 0 }}>
              Pickup
            </Tag>
            <Tag color={activeField === "dest" ? "green" : "default"} style={{ margin: 0 }}>
              Destination
            </Tag>
            {searchLoading && <Spin size="small" style={{ marginLeft: "auto" }} />}
          </div>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        {/* Saved places */}
        {listData.saved.length > 0 && (
          <>
            <Typography.Text strong>Mening manzillarim</Typography.Text>
            <List
              style={{ marginTop: 8, marginBottom: 14 }}
              dataSource={listData.saved}
              renderItem={(p) => (
                <List.Item
                  className="yg-list-item"
                  onClick={() => {
                    // Saved => destination by default
                    setDestFromSuggestion?.({
                      id: p.id || p.place_id,
                      label: p.label || p.name,
                      lat: Number(p.lat),
                      lng: Number(p.lng),
                    });
                  }}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StarFilled style={{ color: "#faad14" }} />
                        <span style={{ fontWeight: 700 }}>{p.name || "Manzil"}</span>
                      </div>
                    }
                    description={<div style={{ opacity: 0.85 }}>{p.label}</div>}
                  />
                </List.Item>
              )}
            />
          </>
        )}

        {/* Search results */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Typography.Text strong>Natijalar</Typography.Text>
          {searchLoading && <Spin size="small" />}
        </div>

        <List
          style={{ marginTop: 8 }}
          dataSource={listData.res}
          renderItem={(item) => (
            <List.Item className="yg-list-item" onClick={() => handlePick(item)}>
              <List.Item.Meta
                title={<div style={{ fontWeight: 700 }}>{item.label}</div>}
                description={<div style={{ opacity: 0.75 }}>{activeField === "pickup" ? "Pickup" : "Destination"}</div>}
              />
            </List.Item>
          )}
        />
      </div>
    </Drawer>
  );
}
