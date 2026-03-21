
export function forecastDemand(regions){
 return regions.map(r=>({
  region:r.region,
  predicted_orders:Math.ceil((r.recent_orders||0)*1.3)
 }))
}
