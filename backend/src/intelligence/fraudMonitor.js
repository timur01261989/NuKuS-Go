
export function detectFraud({cancelCount,orders}){
 if(cancelCount>5) return "cancel_spam";
 if(orders>20) return "multi_order_abuse";
 return null;
}
