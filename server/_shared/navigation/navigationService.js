
export function estimateRoute({distance_km,traffic_factor}){
 const baseSpeed=40
 const adjusted=baseSpeed*(traffic_factor||1)
 const eta=(distance_km/adjusted)*60
 return {eta_min:Math.round(eta)}
}
