
export async function runDriverRepositionWorker({supabase}){
 const {data:tasks}=await supabase
  .from("driver_reposition_tasks")
  .select("*")
  .eq("status","pending")
  .limit(50)

 if(!tasks) return

 for(const t of tasks){
  await supabase.from("driver_reposition_tasks")
   .update({status:"sent"})
   .eq("id",t.id)
 }
}
