import React, { useEffect } from "react";
import { Button } from "antd";
import { AimOutlined } from "@ant-design/icons";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { mapAssets } from "@/assets/map";

const createMapImageIcon = (iconUrl, className) =>
  L.divIcon({
    className,
    html: `<div class="${className}-wrap"><img src="${iconUrl}" alt="" draggable="false" /></div>`,
    iconSize: [50, 68],
    iconAnchor: [25, 60],
  });

export const pickupIcon = createMapImageIcon(mapAssets.pickupPin || mapAssets.userPlacemark || mapAssets.userSelf, "yg-pin");
export const destIcon = createMapImageIcon(mapAssets.finishPin || mapAssets.dropoffPin || mapAssets.routePoint, "yg-dest");


export function CenterWatcher({ onCenterChange, onMoveStart, onMoveEnd }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const fire = () => {
      const c = map.getCenter();
      onCenterChange?.([c.lat, c.lng], map.getZoom());
    };

    const ms = () => onMoveStart?.();
    const me = () => {
      onMoveEnd?.();
      fire();
    };

    map.on("movestart", ms);
    map.on("moveend", me);
    map.on("zoomend", me);

    fire();

    return () => {
      map.off("movestart", ms);
      map.off("moveend", me);
      map.off("zoomend", me);
    };
  }, [map, onCenterChange, onMoveStart, onMoveEnd]);

  return null;
}

export function LocateMeButton({ mapRef, userLoc, bottom = 240, onRequestLocate }) {
  return (
    <div style={{ position: "absolute", right: 16, bottom, zIndex: 800 }}>
      <Button
        shape="circle"
        size="large"
        icon={<img src={mapAssets.controlLocation || mapAssets.pickupPin || mapAssets.userArrow} alt="" className="h-6 w-6 object-contain" />}
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        onClick={onRequestLocate}
      />
    </div>
  );
}
