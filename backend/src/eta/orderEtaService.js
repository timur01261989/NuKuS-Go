
export function estimateEta({distanceMeters}){
 const avgSpeed=30*1000/3600;
 const sec=distanceMeters/avgSpeed;
 return Math.round(sec/60);
}
