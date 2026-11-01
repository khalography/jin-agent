export function mintPlan(quantity,eligibility=null,globalFree=null){
 const total=Math.max(1,Math.min(10,Math.trunc(Number(quantity)||1)));
 const freeAvailable=eligibility?eligibility.free>0:globalFree!==0;
 const free=freeAvailable?1:0,paid=total-free;
 const paidRemaining=eligibility?eligibility.paid:9;
 return {total,free,paid,cost:(paid*0.002).toFixed(3),max:Math.min(10,paidRemaining+free),valid:paid<=paidRemaining,estimated:!eligibility};
}
