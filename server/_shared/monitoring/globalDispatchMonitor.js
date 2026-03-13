
export function summarizeQueue(queueRows){
 return {
  total:queueRows.length,
  pending:queueRows.filter(q=>q.status==="pending").length,
  processing:queueRows.filter(q=>q.status==="processing").length
 }
}
