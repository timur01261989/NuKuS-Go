
export function resolveServicePipeline(service){
 switch(service){
  case "taxi":
   return "dispatch"
  case "delivery":
   return "delivery_dispatch"
  case "freight":
   return "freight_dispatch"
  case "intercity":
   return "intercity_dispatch"
  default:
   return "dispatch"
 }
}
