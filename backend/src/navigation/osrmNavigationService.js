
export async function getOsrmRoute({fromLat,fromLng,toLat,toLng}){
 const url=`https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
 const r=await fetch(url);
 const j=await r.json();
 const route=j.routes?.[0];
 return {distance_m:route?.distance||0,duration_s:route?.duration||0};
}
