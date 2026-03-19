import React from "react";
import Lottie from "lottie-react";
const radarAnim = "/assets/lottie/radar_animation.json";

const SearchRadar = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <Lottie animationData={radarAnim} loop={true} style={{ width: 300, height: 300 }} />
    </div>
  );
};

export default SearchRadar;