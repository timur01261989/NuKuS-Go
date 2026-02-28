import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Spin } from "antd";
import { RightOutlined, ReloadOutlined } from "@ant-design/icons";

/**
 * AutoMarketAdsPanel
 * - Shows Auto-Market listings as "reklama e’lonlar"
 * - Infinite-ish: increases visible items on scroll, re-fetches with larger limit
 *
 * Props:
 *  - title: string
 *  - mode: "waiting" | "inline" (only affects compactness)
 *  - fetchAds: async ({limit, sort}) => listings[]
 *  - onOpenAd: (id) => void
 */
export default function AutoMarketAdsPanel({ title = "E’lonlar", mode = "inline", fetchAds, onOpenAd }) {
  const [items, setItems] = useState([]);
  const [limit, setLimit] = useState(8);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const boxRef = useRef(null);

  const compact = mode === "waiting";

  const load = async (nextLimit = limit) => {
    if (!fetchAds) return;
    setLoading(true);
    setErr("");
    try {
      const list = await fetchAds({ limit: nextLimit, sort: "newest" });
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr("E’lonlarni yuklab bo‘lmadi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(limit); }, [limit]);

  // Auto-load more when user scrolls near the end
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;

    const onScroll = () => {
      const left = el.scrollLeft;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if (left > max - 180) {
        setLimit((l) => (l >= 30 ? l : l + 6));
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const visible = useMemo(() => items.slice(0, limit), [items, limit]);

  return (
    <div style={{ borderRadius: 16, padding: compact ? 10 : 12, background: "rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          style={{ borderRadius: 999 }}
          onClick={() => load(limit)}
        >
          Yangilash
        </Button>
      </div>

      {err ? (
        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>{err}</div>
      ) : null}

      {loading && items.length === 0 ? (
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <Spin />
        </div>
      ) : (
        <div
          ref={boxRef}
          style={{
            marginTop: 10,
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 6,
            WebkitOverflowScrolling: "touch",
          }}
        >
          {visible.map((it) => {
            const id = it?.id ?? it?.listing_id ?? it?.uuid;
            const title = it?.title || it?.name || "E’lon";
            const price = it?.price ? String(it.price) : (it?.price_uzs ? String(it.price_uzs) : "");
            const img = it?.image || it?.img || it?.photo || (Array.isArray(it?.images) ? it.images[0] : null);

            return (
              <button
                key={String(id) + title}
                onClick={() => id && onOpenAd?.(id)}
                style={{
                  minWidth: compact ? 220 : 240,
                  maxWidth: compact ? 220 : 240,
                  borderRadius: 14,
                  padding: 10,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      width: 64,
                      height: 48,
                      borderRadius: 10,
                      background: "rgba(0,0,0,0.06)",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {title}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                      {price ? `${price} so‘m` : "Narx: —"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", opacity: 0.5 }}>
                    <RightOutlined />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {loading && items.length > 0 ? (
        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>Yuklanmoqda…</div>
      ) : null}
    </div>
  );
}
