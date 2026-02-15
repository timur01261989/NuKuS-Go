
import React, { useMemo } from "react";
import { Button, Drawer, Input, Select, Switch } from "antd";
import { useMarketFilters } from "../../context/MarketFilterContext";

const cities = ["Nukus", "Toshkent", "Samarqand", "Buxoro", "Andijon", "Urganch", "Qarshi"];
const brands = ["Chevrolet", "KIA", "Hyundai", "Toyota", "Daewoo", "Mercedes", "BMW"];

export default function FiltersDrawer({ open, onClose }) {
  const { filters, patchFilters, resetFilters } = useMarketFilters();

  const sortOptions = useMemo(() => ([
    { value: "recent", label: "Yangi" },
    { value: "price_asc", label: "Narx ↑" },
    { value: "price_desc", label: "Narx ↓" },
    { value: "year_desc", label: "Yil ↓" },
  ]), []);

  return (
    <Drawer open={open} onClose={onClose} placement="bottom" height="78vh" title="Filtrlar">
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={labelStyle}>Shahar</div>
          <Select
            value={filters.city || undefined}
            onChange={(v) => patchFilters({ city: v || "" })}
            allowClear
            style={{ width: "100%" }}
            options={cities.map((c) => ({ value: c, label: c }))}
          />
        </div>

        <div>
          <div style={labelStyle}>Brend</div>
          <Select
            value={filters.brand || undefined}
            onChange={(v) => patchFilters({ brand: v || "" })}
            allowClear
            style={{ width: "100%" }}
            options={brands.map((b) => ({ value: b, label: b }))}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={labelStyle}>Narx min</div>
            <Input value={filters.minPrice} onChange={(e) => patchFilters({ minPrice: e.target.value })} />
          </div>
          <div>
            <div style={labelStyle}>Narx max</div>
            <Input value={filters.maxPrice} onChange={(e) => patchFilters({ maxPrice: e.target.value })} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={labelStyle}>Yil dan</div>
            <Input value={filters.yearFrom} onChange={(e) => patchFilters({ yearFrom: e.target.value })} />
          </div>
          <div>
            <div style={labelStyle}>Yil gacha</div>
            <Input value={filters.yearTo} onChange={(e) => patchFilters({ yearTo: e.target.value })} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={labelStyle}>Obmen</div>
          <Switch checked={filters.exchange} onChange={(v) => patchFilters({ exchange: v })} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={labelStyle}>Kredit</div>
          <Switch checked={filters.kredit} onChange={(v) => patchFilters({ kredit: v })} />
        </div>

        <div>
          <div style={labelStyle}>Saralash</div>
          <Select
            value={filters.sort}
            onChange={(v) => patchFilters({ sort: v })}
            style={{ width: "100%" }}
            options={sortOptions}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <Button onClick={resetFilters} style={{ borderRadius: 12, flex: 1 }}>Tozalash</Button>
          <Button type="primary" onClick={onClose} style={{ borderRadius: 12, flex: 1 }}>Qo'llash</Button>
        </div>
      </div>
    </Drawer>
  );
}

const labelStyle = { fontSize: 12, color: "#555", marginBottom: 6, fontWeight: 700 };
