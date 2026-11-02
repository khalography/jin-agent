import fs from 'node:fs';
import {JsonRpcProvider,Contract,Interface,FetchRequest} from 'ethers';
import {rankedHolders,applyTransfers} from '../dist/holder-ledger.js';
const address='0x086Ab11dF23e8FD37398C41180466D24d85ed5FB',registryAddress='0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F';
const request=new FetchRequest('https://bsc-rpc.publicnode.com');request.timeout=15000;const p=new JsonRpcProvider(request,56,{staticNetwork:true});
try{
 const file=new URL('../dist/holders-snapshot.json',import.meta.url),old=JSON.parse(fs.readFileSync(file,'utf8'));
 if(old.contractAddress.toLowerCase()!==address.toLowerCase())throw Error('Snapshot contract mismatch');
 const tip=(await p.getBlockNumber())-2,iface=new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
 let balances=new Map(old.holders.map(r=>[r.wallet.toLowerCase(),BigInt(r.balance)]));
 for(let from=old.blockNumber+1;from<=tip;from+=2000){
  const to=Math.min(from+1999,tip);let logs;
  try{logs=await p.getLogs({address,topics:[iface.getEvent('Transfer').topicHash],fromBlock:from,toBlock:to});}
  catch{logs=[];for(let b=from;b<=to;b+=500)logs.push(...await p.getLogs({address,topics:[iface.getEvent('Transfer').topicHash],fromBlock:b,toBlock:Math.min(b+499,to)}));}
  logs.sort((a,b)=>a.blockNumber-b.blockNumber||a.index-b.index);balances=applyTransfers(balances,logs.map(log=>iface.parseLog(log).args));
 }
 const token=new Contract(address,['function totalSupply() view returns(uint256)','function balanceOf(address) view returns(uint256)'],p),total=await token.totalSupply({blockTag:tip}),ranked=rankedHolders(balances);
 if(ranked.reduce((n,r)=>n+r.balance,0n)!==total)throw Error('Balances do not equal total supply');
 for(const row of ranked.slice(0,10))if(await token.balanceOf(row.wallet,{blockTag:tip})!==row.balance)throw Error('Top-holder balance mismatch');
 const holders=ranked.map(r=>({wallet:r.wallet,balance:String(r.balance)}));
 fs.writeFileSync(file,JSON.stringify({...old,registryAddress,blockNumber:tip,blockHash:(await p.getBlock(tip)).hash,totalSupply:String(total),generatedAt:new Date().toISOString(),holders}));
 console.log(JSON.stringify({holders:holders.length,block:tip,totalSupply:String(total),top:holders.slice(0,5)}));
}finally{p.destroy()}
