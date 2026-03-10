
export async function recordDriverEarning({supabase,driverId,orderId,amount}){
 await supabase.from("driver_earnings").insert({
  driver_id:driverId,
  order_id:orderId,
  amount
 });
}
