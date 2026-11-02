const ZERO='0x0000000000000000000000000000000000000000';
export function rankedHolders(balances){return [...balances].map(([wallet,balance])=>({wallet,balance:BigInt(balance)})).filter(r=>r.balance>0n).sort((a,b)=>a.balance>b.balance?-1:a.balance<b.balance?1:a.wallet.localeCompare(b.wallet));}
export function applyTransfers(balances,events){
 const next=new Map(balances);
 for(const event of events){const from=event.from.toLowerCase(),to=event.to.toLowerCase(),value=BigInt(event.value);if(value<0n)throw Error('Invalid transfer');
  if(from!==ZERO){const balance=(next.get(from)||0n)-value;if(balance<0n)throw Error('Incomplete transfer history');if(balance===0n)next.delete(from);else next.set(from,balance);}
  if(to!==ZERO)next.set(to,(next.get(to)||0n)+value);
 }
 return next;
}
