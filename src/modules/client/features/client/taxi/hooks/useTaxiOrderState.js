import { useMemo, useState } from "react";

export function useTaxiOrderState() {
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [completedOrderForRating, setCompletedOrderForRating] = useState(null);
  const [bonusVisible, setBonusVisible] = useState(false);
  const [earnedBonus, setEarnedBonus] = useState(0);
  const [etaMin, setEtaMin] = useState(null);
  const [etaUpdatedAt, setEtaUpdatedAt] = useState(null);

  return useMemo(() => ({
    orderId,
    setOrderId,
    orderStatus,
    setOrderStatus,
    assignedDriver,
    setAssignedDriver,
    ratingVisible,
    setRatingVisible,
    completedOrderForRating,
    setCompletedOrderForRating,
    bonusVisible,
    setBonusVisible,
    earnedBonus,
    setEarnedBonus,
    etaMin,
    setEtaMin,
    etaUpdatedAt,
    setEtaUpdatedAt,
  }), [
    orderId,
    orderStatus,
    assignedDriver,
    ratingVisible,
    completedOrderForRating,
    bonusVisible,
    earnedBonus,
    etaMin,
    etaUpdatedAt,
  ]);
}
