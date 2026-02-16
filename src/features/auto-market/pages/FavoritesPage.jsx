import React, { useMemo } from "react";
import { useMarketStore } from "../stores/marketStore";
import { useMarket } from "../context/MarketContext";
import CarCardVertical from "../components/Feed/CarCardVertical";

export default function FavoritesPage() {
  const { favorites } = useMarketStore();
  const { cars } = useMarket();

  const favIds = useMemo(() => Object.keys(favorites).filter((k) => favorites[k]), [favorites]);
  const favCars = useMemo(() => cars.filter((c) => favIds.includes(String(c.id))), [cars, favIds]);

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 12 }}>Sevimlilar ❤️</div>
      {favCars.length === 0 ? (
        <div style={{ opacity: 0.7 }}>Hozircha sevimlilar yo‘q</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {favCars.map((c) => (
            <CarCardVertical key={c.id} car={c} />
          ))}
        </div>
      )}
    </div>
  );
}
