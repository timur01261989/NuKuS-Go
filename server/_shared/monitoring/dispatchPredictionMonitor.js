export function summarizePredictionRows(rows = []) {
  const totalPredictedOrders = rows.reduce(
    (sum, row) => sum + Number(row.predicted_orders || 0),
    0
  );
  const totalPredictedDriversNeeded = rows.reduce(
    (sum, row) => sum + Number(row.predicted_drivers_needed || 0),
    0
  );

  return {
    count: rows.length,
    total_predicted_orders: totalPredictedOrders,
    total_predicted_drivers_needed: totalPredictedDriversNeeded,
  };
}
