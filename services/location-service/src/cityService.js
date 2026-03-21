
export function resolveCityKey({lat,lng}){
 if(lat>40) return "north"
 return "south"
}
