
import { withAuth } from "../_shared/withAuth.js"
import { publishEvent } from "../_shared/events/eventStreamService.js"
import { getServiceSupabase } from "../_shared/supabase.js"

async function handler(req,res){

 if(req.method!=="POST"){
  res.status(405).json({error:"method_not_allowed"})
  return
 }

 const supabase=getServiceSupabase()
 const order=req.body

 const {data,error}=await supabase
  .from("dispatch_job_queue")
  .insert({
   order_id:order.id,
   payload:order,
   status:"pending"
  })

 if(error){
  res.status(500).json({error:error.message})
  return
 }

 await publishEvent({
   supabase,
   streamType: "dispatch_job_enqueued",
   entityId: order.id || null,
   payload: order,
 })

 res.status(200).json({ok:true,data})
}

export default withAuth(handler)
