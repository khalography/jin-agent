import {rankedHolders,applyTransfers} from './holder-ledger.js';
export {rankedHolders};
export function startHolders(cfg,getLanguage){
 const $=id=>document.getElementById(id),names=new Map();
 let balances=new Map(),cursor=0,page=0,state='loading',running=false,library,nameRequest=0,targetBlock=0;
 const size=20,short=a=>a.slice(0,6)+'…'+a.slice(-4);
 function render(){
  const cn=getLanguage()==='zh',rows=rankedHolders(balances),pages=Math.max(1,Math.ceil(rows.length/size));page=Math.min(page,pages-1);
  $('holdersTitle').textContent=cn?'$JIN 持有者':'$JIN holders';$('holdersCount').textContent=cn?`${rows.length.toLocaleString()} 个持有钱包`:`${rows.length.toLocaleString()} holding wallets`;
  $('holdersRank').textContent=cn?'排名':'Rank';$('holdersName').textContent=cn?'Agent ID / 钱包':'Agent ID / wallet';$('holdersBalance').textContent=cn?'持仓':'Holdings';
  $('holdersPrev').textContent=cn?'上一页':'Previous';$('holdersNext').textContent=cn?'下一页':'Next';$('holdersPrev').disabled=page===0;$('holdersNext').disabled=page>=pages-1;$('holdersPage').textContent=`${page+1} / ${pages}`;
  $('holdersNote').textContent=cn?'按钱包余额排序；.ai 名称独立核验，无可用名称时显示地址。':'Ranked by wallet balance; .ai names are checked separately. Addresses appear when no name is available.';
  const block=cursor.toLocaleString('en-US');
  $('holdersStatus').textContent=state==='loading'?(cn?'正在读取确认持仓…':'Reading confirmed holdings…'):state==='error'?(cn?`实时刷新暂不可用 · 保留区块 ${block} 的已确认余额`:`Live refresh unavailable · Retaining confirmed balances at block ${block}`):state==='syncing'?(cn?`正在同步链上转账 · 已读取至区块 ${block}`:`Syncing on-chain transfers · Read through block ${block}`):(cn?`已确认至区块 ${block} · 每 30 秒刷新 · 包含转入与转出`:`Confirmed at block ${block} · Refreshes every 30s · Includes transfers in and out`);
  $('holdersEmpty').hidden=rows.length>0;$('holdersEmpty').textContent=state==='loading'?(cn?'正在加载链上持仓…':'Loading on-chain holdings…'):(cn?'暂无可显示的持仓。':'No holdings to display.');
  const body=$('holdersRows');body.replaceChildren();
  rows.slice(page*size,(page+1)*size).forEach((row,i)=>{
   const tr=document.createElement('tr'),rank=document.createElement('td'),identity=document.createElement('td'),amount=document.createElement('td'),link=document.createElement('a'),sub=document.createElement('small');
   rank.textContent=String(page*size+i+1);link.href='https://bscscan.com/address/'+row.wallet;link.target='_blank';link.rel='noopener noreferrer';link.textContent=names.get(row.wallet)||short(row.wallet);
   sub.textContent=names.get(row.wallet)?short(row.wallet):(cn?'钱包地址':'Wallet address');
   const whole=row.balance/10n**18n,fraction=(row.balance%10n**18n).toString().padStart(18,'0').replace(/0+$/,'');
   amount.textContent=whole.toLocaleString('en-US')+(fraction?'.'+fraction.slice(0,6):'')+' $JIN';amount.title=whole.toString()+(fraction?'.'+fraction:'')+' $JIN';
   identity.append(link,sub);tr.append(rank,identity,amount);body.append(tr);
  });
 }
 async function resolveNames(){
  if(!library||!cursor)return;const ticket=++nameRequest,block=cursor,visible=rankedHolders(balances).slice(page*size,(page+1)*size);let provider;
  try{
   const request=new library.FetchRequest(cfg.rpcUrl);request.timeout=12000;provider=new library.JsonRpcProvider(request,cfg.chainId,{staticNetwork:true});
   const registry=new library.Contract('0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F',['function handleOf(address) view returns(string)','function ownerOf(uint256) view returns(address)'],provider);
   for(let i=0;i<visible.length;i+=4){
    await Promise.all(visible.slice(i,i+4).map(async row=>{
     try{const raw=await registry.handleOf(row.wallet,{blockTag:block}),handle=raw.toLowerCase().replace(/\.ai$/,'');let name=null;
      if(/^[a-z0-9]{3,15}$/.test(handle)){const owner=await registry.ownerOf(BigInt(library.id(handle)),{blockTag:block});if(owner.toLowerCase()===row.wallet)name=handle+'.ai';}
      if(ticket===nameRequest)names.set(row.wallet,name);
     }catch{if(ticket===nameRequest)names.delete(row.wallet);}
    }));if(ticket!==nameRequest)return;
   }
  }finally{provider?.destroy();if(ticket===nameRequest)render();}
 }
 async function refresh(){
  if(running||document.hidden)return;running=true;let provider;
  try{
   library??=await import('./assets/ethers.min.js');
   if(!cursor){const response=await fetch('./holders-snapshot.json',{cache:'no-cache'});if(!response.ok)throw Error('Snapshot unavailable');const snapshot=await response.json();if(snapshot.contractAddress.toLowerCase()!==cfg.mintAddress.toLowerCase()||snapshot.chainId!==cfg.chainId)throw Error('Snapshot mismatch');for(const r of snapshot.holders)balances.set(r.wallet.toLowerCase(),BigInt(r.balance));cursor=snapshot.blockNumber;state='syncing';render();}
   const request=new library.FetchRequest(cfg.rpcUrl);request.timeout=12000;provider=new library.JsonRpcProvider(request,cfg.chainId,{staticNetwork:true});targetBlock=Math.max(cursor,(await provider.getBlockNumber())-2);
   const end=Math.min(targetBlock,cursor+4000),iface=new library.Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
   while(cursor<end){
    const to=Math.min(cursor+500,end);
    const logs=await provider.getLogs({address:cfg.mintAddress,fromBlock:cursor+1,toBlock:to,topics:[iface.getEvent('Transfer').topicHash]});
    logs.sort((a,b)=>a.blockNumber-b.blockNumber||a.index-b.index);
    const events=logs.map(log=>iface.parseLog(log).args);
    balances=applyTransfers(balances,events);cursor=to;state=cursor<targetBlock?'syncing':'live';render();
   }
   state=cursor<targetBlock?'syncing':'live';
  }catch{state='error';}
  finally{provider?.destroy();running=false;render();resolveNames().catch(()=>{});if(state==='syncing')setTimeout(refresh,100);}
 }
 $('holdersPrev').addEventListener('click',()=>{page=Math.max(0,page-1);render();resolveNames().catch(()=>{})});
 $('holdersNext').addEventListener('click',()=>{page++;render();resolveNames().catch(()=>{})});
 $('lang').addEventListener('click',render);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 render();refresh();setInterval(refresh,30000);
}
