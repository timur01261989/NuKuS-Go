
export function computeAdvancedSurge({
 demand=0,
 supply=1,
 trafficFactor=1,
 timeFactor=1
}){

 if(supply===0) return 2

 const base = demand/supply

 const surge = base * trafficFactor * timeFactor

 if(surge>3) return 3
 if(surge>2) return 2
 if(surge>1.5) return 1.5

 return 1

}
