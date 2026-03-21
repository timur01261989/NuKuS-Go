import React, { useMemo, useState } from "react";
import { Carousel, Image } from "antd";

export default function GallerySlider({ images = [] }) {
  const imgs = useMemo(() => (Array.isArray(images) ? images : []).filter(Boolean), [images]);
  if (!imgs.length) return null;

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <Carousel dots>
        {imgs.map((src, idx) => (
          <div key={idx}>
            <Image
              src={src}
              alt=""
              preview={false}
              style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </Carousel>
    </div>
  );
}
