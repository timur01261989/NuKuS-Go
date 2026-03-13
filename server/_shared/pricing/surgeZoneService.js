
export function applySurge(baseFare, multiplier){
  if(!multiplier) multiplier = 1
  return baseFare * multiplier
}
