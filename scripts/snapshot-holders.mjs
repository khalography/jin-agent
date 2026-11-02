import fs from 'node:fs';import {JsonRpcProvider,Contract,Interface,ZeroAddress,FetchRequest} from 'ethers';
const address='0x086Ab11dF23e8FD37398C41180466D24d85ed5FB',registryAddress='0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F';
const request=new FetchRequest('https://bsc-rpc.publicnode.com');request.timeout=15000;const p=new JsonRpcProvider(request,56,{staticNetwork:true});
try{
 const token=new Contract(address,['function opensAt() view returns(uint64)','function balanceOf(address) view returns(uint256)','function totalSupply() view returns(uint256)'],p);
 const tip=(await p.getBlockNumber())-2,opening=Number(await token.opensAt());let low=131050353,high=tip;
 while(low<high){const mid=Math.floor((low+high)/2);if((await p.getBlock(mid)).timestamp<opening)low=mid+1;else high=mid;}
 const iface=new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']),wallets=new Set();
 for(let from=low;from<=tip;from+=500){const logs=await p.getLogs({address,topics:[iface.getEvent('Transfer').topicHash],fromBlock:from,toBlock:Math.min(from+499,tip)});for(const log of logs){const e=iface.parseLog(log);for(const a of [e.args.from,e.args.to])if(a!==ZeroAddress)wallets.add(a.toLowerCase());}}
 const rows=[];const all=[...wallets];for(let i=0;i<all.length;i+=6)rows.push(...await Promise.all(all.slice(i,i+6).map(async wallet=>({wallet,balance:String(await token.balanceOf(wallet,{blockTag:tip}))}))));
 const holders=rows.filter(r=>BigInt(r.balance)>0n).sort((a,b)=>BigInt(a.balance)>BigInt(b.balance)?-1:BigInt(a.balance)<BigInt(b.balance)?1:a.wallet.localeCompare(b.wallet));
 const total=await token.totalSupply({blockTag:tip});if(holders.reduce((n,r)=>n+BigInt(r.balance),0n)!==total)throw Error('Holder balances do not equal total supply');
 const snapshot={chainId:56,contractAddress:address,registryAddress,blockNumber:tip,startBlock:low,totalSupply:String(total),generatedAt:new Date().toISOString(),holders};
 fs.writeFileSync(new URL('../dist/holders-snapshot.json',import.meta.url),JSON.stringify(snapshot,null,2));console.log(JSON.stringify({holders:holders.length,block:tip,startBlock:low,totalSupply:String(total)}));
}finally{p.destroy()}
