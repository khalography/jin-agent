// Read-only tracker: confirmed UnitsMinted logs from the most recent 2,000 blocks.
export function startMintTracker(cfg,getLanguage){
 const $=id=>document.getElementById(id);
 let records=[],cursor=null,state='loading',checkedBlock=0,running=false,library;
 function render(){
  const cn=getLanguage()==='zh';
  $('trackerTitle').textContent=cn?'实时铸造':'Live mints';
  $('trackerBadge').textContent=state==='live'?(cn?'实时':'Live'):state==='error'?(cn?'连接中断':'Offline'):(cn?'读取中':'Loading');
  $('trackerBadge').classList.toggle('live',state==='live');
  $('trackerStatus').textContent=state==='live'?(cn?`最近链上记录 · 至区块 ${checkedBlock.toLocaleString('en-US')} · 每 15 秒刷新`:`Recent on-chain activity · Block ${checkedBlock.toLocaleString('en-US')} · Refreshes every 15s`):state==='error'?(cn?'暂时无法刷新。保留的记录不代表最新状态。':'Refresh unavailable. Retained events may be out of date.'):(cn?'正在读取已确认的铸造记录…':'Reading confirmed mint events…');
  $('trackerExplorer').textContent=cn?'在 BscScan 查看合约活动':'View contract activity on BscScan';
  $('trackerEmpty').hidden=records.length>0;
  $('trackerEmptyText').textContent=state==='error'?(cn?'暂时无法加载链上记录，请稍后重试。':'Unable to load on-chain activity. Retrying shortly.'):state==='loading'?(cn?'链上确认的铸造记录将在这里显示。':'Confirmed mint events will appear here.'):(cn?'最近 2,000 个区块暂无铸造记录。开铸后的确认记录将在这里显示。':'No mints in the latest 2,000 blocks. Confirmed activity will appear here after opening.');
  const list=$('trackerList');list.replaceChildren();
  for(const row of records){
   const li=document.createElement('li'),left=document.createElement('div'),right=document.createElement('a'),wallet=document.createElement('a'),time=document.createElement('small'),amount=document.createElement('strong'),kind=document.createElement('small');
   wallet.className='tracker-wallet';wallet.href='https://bscscan.com/address/'+row.wallet;wallet.target='_blank';wallet.rel='noopener noreferrer';wallet.textContent=row.wallet.slice(0,6)+'…'+row.wallet.slice(-4);
   time.textContent=new Date(row.timestamp*1000).toLocaleTimeString(cn?'zh-CN':'en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit'})+' UTC';
   right.className='tracker-amount';right.href='https://bscscan.com/tx/'+row.hash;right.target='_blank';right.rel='noopener noreferrer';
   amount.textContent=(row.quantity*1000).toLocaleString('en-US')+' $JIN';kind.textContent=cn?`${row.quantity} 份 · ${row.free?'免费':'付费'}`:`${row.quantity} unit${row.quantity===1?'':'s'} · ${row.free?'Free':'Paid'}`;
   left.append(wallet,time);right.append(amount,kind);li.append(left,right);list.append(li);
  }
 }
 async function refresh(){
  if(running||document.hidden)return;running=true;let provider;
  try{
   library??=await import('./assets/ethers.min.js');const request=new library.FetchRequest(cfg.rpcUrl);request.timeout=12000;
   provider=new library.JsonRpcProvider(request,cfg.chainId,{staticNetwork:true});
   const latest=Math.max(0,(await provider.getBlockNumber())-2),start=Math.max(131050353,latest-1999,cursor===null?0:cursor+1);
   const iface=new library.Interface(['event UnitsMinted(address indexed wallet,bytes32 indexed identity,uint256 quantity,bool free)']);
   const logs=[];
   for(let from=start;from<=latest;from+=500)logs.push(...await provider.getLogs({address:cfg.mintAddress,fromBlock:from,toBlock:Math.min(from+499,latest),topics:[iface.getEvent('UnitsMinted').topicHash]}));
   const newest=logs.sort((a,b)=>b.blockNumber-a.blockNumber||b.index-a.index).slice(0,12);
   const blocks=new Map(await Promise.all([...new Set(newest.map(l=>l.blockNumber))].map(async n=>[n,await provider.getBlock(n)])));
   const incoming=newest.map(log=>{const event=iface.parseLog(log);return {key:log.transactionHash+':'+log.index,hash:log.transactionHash,wallet:event.args.wallet,quantity:Number(event.args.quantity),free:event.args.free,block:log.blockNumber,index:log.index,timestamp:blocks.get(log.blockNumber).timestamp}});
   records=[...new Map([...incoming,...records].filter(r=>r.block>=latest-1999).map(r=>[r.key,r])).values()].sort((a,b)=>b.block-a.block||b.index-a.index).slice(0,12);
   cursor=latest;checkedBlock=latest;state='live';
  }catch{state='error';}
  finally{provider?.destroy();running=false;render();}
 }
 $('lang').addEventListener('click',render);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
 render();refresh();setInterval(refresh,15000);
}
