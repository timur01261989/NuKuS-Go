
export function detectFraud(order){
 const dist=Number(order?.distance_km||0)
 const fare=Number(order?.fare||0)
 if(dist>0 && fare/dist>10){
   return {flag:true,reason:"fare_distance_anomaly"}
 }
 return {flag:false}
}
