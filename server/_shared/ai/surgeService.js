
export function computeSurge({demand=0,supply=1}){
 if(supply===0) return 2
 const ratio=demand/supply
 if(ratio>2) return 2
 if(ratio>1.5) return 1.5
 if(ratio>1.2) return 1.2
 return 1
}
