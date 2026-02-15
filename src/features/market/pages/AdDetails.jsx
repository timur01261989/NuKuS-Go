
import React, { useMemo } from "react";
import { Spin } from "antd";
import BackNavLayout from "../layouts/BackNavLayout";
import { useParams } from "react-router-dom";
import useAdDetails from "../hooks/useAdDetails";
import PhotosCarousel from "../components/Details/PhotosCarousel";
import AdMeta from "../components/Details/AdMeta";
import SellerCard from "../components/Details/SellerCard";
import SimilarAds from "../components/Details/SimilarAds";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import { getFavorites } from "../services/marketApi";

export default function AdDetails() {
  const { id } = useParams();
  const { ad, loading } = useAdDetails(id);
  const { push } = useRecentlyViewed();

  React.useEffect(() => { if (ad) push(ad); }, [ad, push]);

  const similars = useMemo(() => {
    // demo: show favorites as "similar"
    const fav = getFavorites();
    return fav.filter((x) => String(x.id) !== String(id));
  }, [id]);

  return (
    <BackNavLayout title="E'lon">
      {loading ? (
        <div style={{ padding: 30, display: "grid", placeItems: "center" }}>
          <Spin />
        </div>
      ) : null}

      {ad ? (
        <>
          <PhotosCarousel photos={ad.photos || []} />
          <AdMeta ad={ad} />
          <SellerCard seller={ad.seller} />
          <SimilarAds items={similars} />
          <div style={{ height: 30 }} />
        </>
      ) : (
        !loading ? <div style={{ padding: 24, color: "#777" }}>E'lon topilmadi</div> : null
      )}
    </BackNavLayout>
  );
}
