
export async function recordDispatchMetric({supabase,orderId,driversSent,accepted}){
 await supabase.from("dispatch_metrics").insert({
  order_id:orderId,
  drivers_sent:driversSent,
  accepted
 });
}
