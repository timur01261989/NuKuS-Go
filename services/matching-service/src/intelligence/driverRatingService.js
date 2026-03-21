export function recalculateDriverRating(ratings = []) {
  const list = (Array.isArray(ratings) ? ratings : []).map(Number).filter((x) => Number.isFinite(x) && x >= 1 && x <= 5);
  if (!list.length) return { rating: 5, votes: 0 };
  const sum = list.reduce((acc, cur) => acc + cur, 0);
  return { rating: Number((sum / list.length).toFixed(2)), votes: list.length };
}
