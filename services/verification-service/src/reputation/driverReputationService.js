export function calculateDriverReputation({ rating = 5, cancelRate = 0, complaintRate = 0 }) {
  const ratingScore = Math.min(1, Math.max(0, Number(rating || 0) / 5));
  const cancelPenalty = Math.min(1, Math.max(0, 1 - Number(cancelRate || 0)));
  const complaintPenalty = Math.min(1, Math.max(0, 1 - Number(complaintRate || 0)));

  const score = Number((ratingScore * 0.6 + cancelPenalty * 0.25 + complaintPenalty * 0.15).toFixed(4));

  return {
    score,
    ratingScore,
    cancelPenalty,
    complaintPenalty,
  };
}
