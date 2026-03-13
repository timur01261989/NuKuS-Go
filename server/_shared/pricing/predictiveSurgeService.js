
export function calculatePredictiveSurge(predictedOrders,drivers){
 if(!drivers||drivers==0) return 1.5
 const ratio=predictedOrders/drivers
 if(ratio>3) return 2
 if(ratio>2) return 1.5
 if(ratio>1) return 1.2
 return 1
}
