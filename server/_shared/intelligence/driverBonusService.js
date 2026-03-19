
export function calculateDriverBonus(stats){
 const trips=Number(stats?.completed_trips||0)
 if(trips>=50) return 50
 if(trips>=30) return 20
 return 0
}
