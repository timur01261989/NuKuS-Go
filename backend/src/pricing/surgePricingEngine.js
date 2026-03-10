
export function calculateSurge({activeOrders,activeDrivers}){
 if(!activeDrivers) return 1;
 const ratio=activeOrders/activeDrivers;
 if(ratio>5) return 3;
 if(ratio>3) return 2;
 if(ratio>2) return 1.5;
 return 1;
}
