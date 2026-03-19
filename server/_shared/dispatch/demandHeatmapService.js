
export function updateDemandHeatmap(points){
  return points.map(p=>({
    lat:p.lat,
    lng:p.lng,
    demand_score:p.orders || 0
  }))
}
