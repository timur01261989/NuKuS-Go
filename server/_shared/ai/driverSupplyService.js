
export function predictDriverSupply(regions){
 return regions.map(r=>({
  region:r.region,
  drivers_required:Math.ceil((r.predicted_orders||0)/2)
 }))
}
