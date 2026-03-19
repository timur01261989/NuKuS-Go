
export async function enqueueDispatchJob({supabase,order}){
 return supabase
  .from("dispatch_job_queue")
  .insert({
    order_id:order.id,
    payload:order,
    status:"pending"
  })
}
