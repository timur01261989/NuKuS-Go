export function buildAvoidOptions({ avoidUnpaved=false, avoidFerries=false } = {}){
  const avoid=[];
  if(avoidUnpaved) avoid.push('unpavedroads');
  if(avoidFerries) avoid.push('ferries');
  return { avoid };
}
