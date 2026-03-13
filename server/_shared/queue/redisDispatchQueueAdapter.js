
export class RedisDispatchQueueAdapter{
 constructor(client){
  this.client=client
 }

 async enqueue(job){
  if(!this.client) return
  await this.client.lpush("dispatch_jobs",JSON.stringify(job))
 }

 async dequeue(){
  if(!this.client) return null
  const job=await this.client.rpop("dispatch_jobs")
  return job?JSON.parse(job):null
 }
}
