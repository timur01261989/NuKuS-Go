
export function evaluateFraudRisk(events){
 let score=0
 events.forEach(e=>{
  if(e.type==="location_spoof") score+=0.6
  if(e.type==="order_spam") score+=0.4
 })
 return Math.min(score,1)
}
