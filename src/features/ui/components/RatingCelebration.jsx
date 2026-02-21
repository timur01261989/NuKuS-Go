import Lottie from "lottie-react";
import fiveStarAnim from "../../../assets/lottie/selfie_cool_dog_light.json";

const RatingCelebration = ({ show }) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.8)'
    }}>
      <Lottie 
        animationData={fiveStarAnim} 
        loop={false} 
        onComplete={() => console.log("Animatsiya tugadi")}
      />
    </div>
  );
};

export default RatingCelebration;