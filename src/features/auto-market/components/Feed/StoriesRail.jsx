import React from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../Common/StatusBadge";

export default function StoriesRail({ items = [] }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>Tezkor e'lonlar</div>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }}>
        {items.slice(0, 12).map((c) => (
          <Link key={c.id} to={`/auto-market/details/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 140, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
              <div style={{ position: "relative" }}>
                <img src={(c.images || [])[0]} alt="" style={{ width: "100%", height: 90, objectFit: "cover" }} />
                <div style={{ position: "absolute", top: 8, left: 8 }}>
                  <StatusBadge status="top" />
                </div>
              </div>
              <div style={{ padding: 8, fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
