
export function computeDriverDistribution(demandMap){
 return demandMap.map(d=>({
  region:d.region,
  drivers_needed:Math.ceil((d.orders||0)/2)
 }))
}
