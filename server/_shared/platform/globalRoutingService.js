
export function resolveDispatchRegion({lat}){
 if(lat>45) return "EU"
 if(lat>35) return "ASIA"
 return "GLOBAL"
}
