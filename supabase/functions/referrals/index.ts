import {Contract,JsonRpcProvider,FetchRequest,id,verifyTypedData} from 'npm:ethers@6.17.0';
const TOKEN='0x086Ab11dF23e8FD37398C41180466D24d85ed5FB',REGISTRY='0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F';
const BASE=Deno.env.get('SUPABASE_URL'),KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const domain={name:'JIN Referral Registration',version:'1',chainId:56,verifyingContract:TOKEN};
const types={Referral:[{name:'referrer',type:'string'},{name:'referred',type:'string'},{name:'wallet',type:'address'},{name:'nonce',type:'string'},{name:'expiresAt',type:'uint256'}]};
const origins=new Set(['https://www.jin-agent.online','https://jin-agent.online','http://127.0.0.1:4173','http://localhost:4173']);
const clean=x=>{const h=String(x||'').trim().toLowerCase().replace(/\.ai$/,'');if(!/^[a-z0-9]{3,15}$/.test(h))throw Error('Enter a valid Binance .ai name');return h;};
async function db(method,path,body){const response=await fetch(BASE+'/rest/v1/'+path,{method,headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});if(!response.ok){console.error('Database request failed',response.status);throw Error('Unable to update referral records');}const text=await response.text();return text?JSON.parse(text):null;}
async function readAll(path){const all=[];path=path.replace(/&limit=10000$/,'');for(let offset=0;;offset+=1000){const rows=await db('GET',path+'&limit=1000&offset='+offset);all.push(...rows);if(rows.length<1000)return all;}}
function chain(){const req=new FetchRequest('https://bsc-rpc.publicnode.com');req.timeout=10000;const provider=new JsonRpcProvider(req,56,{staticNetwork:true});return {provider,registry:new Contract(REGISTRY,['function ownerOf(uint256) view returns(address)'],provider),token:new Contract(TOKEN,['function paidByIdentity(bytes32) view returns(uint256)'],provider)};}
async function identity(registry,handle,block){return {key:id(handle),handle,wallet:(await registry.ownerOf(BigInt(id(handle)),{blockTag:block})).toLowerCase()};}
export async function handler(req){
 const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS',Vary:'Origin'};
 if(origin&&origins.has(origin))headers['Access-Control-Allow-Origin']=origin;
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 const url=new URL(req.url),action=url.searchParams.get('action')||'health';let provider;
 try{
 if(action==='health')return reply({ok:true,program:'jin-referrals',contract:TOKEN,paidUnitsRequired:9,referralsPerReward:3,rewardJIN:1000,payouts:'manual'});
 if(action==='docs')return reply({registerBefore:'first paid mint',challenge:{method:'POST',query:'?action=challenge',body:{referrer:'name without .ai',referred:'name without .ai'}},register:{method:'POST',query:'?action=register',body:{challengeId:'UUID returned by challenge',signature:'EIP-712 signature of EXACT returned domain/types/message'}},signing:'Review typed data. This only registers a referral, not a token approval or payment. Sign with the current Agent ID owner. Never share keys.',status:{method:'GET',query:'?action=status&handle=REFERRER_NAME&page=0'},rule:'Each referred identity counts once after 9 paid units. Every 3 qualified identities earns 1,000 JIN. Rewards await manual distribution.'});
 if(!['challenge','register','status'].includes(action))return reply({error:'Unknown action'},404);
 if(action==='status'&&req.method!=='GET'||action!=='status'&&req.method!=='POST')return reply({error:'Method not allowed'},405);
 const c=chain();provider=c.provider;
 if(action==='challenge'){
  if(Number(req.headers.get('content-length')||0)>4096)return reply({error:'Request too large'},413);
  const body=await req.json(),referrer=clean(body.referrer),referred=clean(body.referred);if(referrer===referred)throw Error('Self referrals are not allowed');
  const block=await provider.getBlockNumber(),[a,b]=await Promise.all([identity(c.registry,referrer,block),identity(c.registry,referred,block)]);if(a.wallet===b.wallet)throw Error('Self referrals are not allowed');if(await c.token.paidByIdentity(b.key,{blockTag:block})!==0n)throw Error('Register before the first paid mint');
  const cutoff=new Date(Date.now()-600000).toISOString(),recent=await db('GET','jin_referral_challenges?select=id&wallet=eq.'+b.wallet+'&created_at=gte.'+encodeURIComponent(cutoff)+'&limit=5');if(recent.length>=5)return reply({error:'Too many requests. Try again in 10 minutes.'},429);
  const nonce=crypto.randomUUID(),expiresAt=Math.floor(Date.now()/1000)+600,message={referrer,referred,wallet:b.wallet,nonce,expiresAt},typedData={domain,types,primaryType:'Referral',message};
  const [record]=await db('POST','jin_referral_challenges',{wallet:b.wallet,nonce_hash:id(nonce),message:JSON.stringify(typedData),expires_at:new Date(expiresAt*1000).toISOString()});
  return reply({challengeId:record.id,typedData,expiresAt,wallet:b.wallet});
 }
 if(action==='register'){
  if(Number(req.headers.get('content-length')||0)>4096)return reply({error:'Request too large'},413);
  const body=await req.json();if(!/^[0-9a-f-]{36}$/i.test(body.challengeId||'')||!/^0x[0-9a-f]{130}$/i.test(body.signature||''))throw Error('Invalid challenge or signature');
  const [challenge]=await db('GET','jin_referral_challenges?select=*&id=eq.'+body.challengeId);if(!challenge||challenge.consumed_at||Date.parse(challenge.expires_at)<=Date.now())throw Error('Challenge expired or already used');
  const typed=JSON.parse(challenge.message),signer=verifyTypedData(typed.domain,typed.types,typed.message,body.signature).toLowerCase();if(signer!==challenge.wallet)throw Error('Signature does not match referred wallet');
  const block=await provider.getBlockNumber(),[a,b]=await Promise.all([identity(c.registry,clean(typed.message.referrer),block),identity(c.registry,clean(typed.message.referred),block)]);if(signer!==b.wallet)throw Error('Agent ID ownership changed; start again');if(a.wallet===b.wallet)throw Error('Self referrals are not allowed');if(await c.token.paidByIdentity(b.key,{blockTag:block})!==0n)throw Error('Register before the first paid mint');
  const existing=await db('GET','jin_referral_bindings?select=referrer_id&referred_id=eq.'+b.key);if(existing.length)return existing[0].referrer_id===a.key?reply({registered:true,referrer:a.handle+'.ai',referred:b.handle+'.ai'}):reply({error:'Agent ID already has a referrer'},409);
  await db('POST','rpc/jin_register_referral',{p_challenge:body.challengeId,p_referrer:a.key,p_referred:b.key,p_referrer_handle:a.handle,p_referred_handle:b.handle,p_referrer_wallet:a.wallet,p_referred_wallet:b.wallet,p_block:block});
  return reply({registered:true,referrer:a.handle+'.ai',referred:b.handle+'.ai',registeredBlock:block});
 }
 const handle=clean(url.searchParams.get('handle')),key=id(handle),page=Math.max(0,Math.min(1000,Number.parseInt(url.searchParams.get('page')||'0')||0));
 const confirmed=Math.max(0,(await provider.getBlockNumber())-64);
 const pending=await db('GET','jin_referral_bindings?select=referred_id,attribution_block&referrer_id=eq.'+key+'&paid_units=lt.9&order=checked_block.asc.nullsfirst&limit=12');
 for(let i=0;i<pending.length;i+=4)await Promise.all(pending.slice(i,i+4).map(async row=>{if(row.attribution_block>=confirmed)return;const paid=Number(await c.token.paidByIdentity(row.referred_id,{blockTag:confirmed}));await db('PATCH','jin_referral_bindings?referred_id=eq.'+row.referred_id,{paid_units:Math.min(9,paid),checked_block:confirmed,...(paid===9?{qualified_block:confirmed}:{})});}));
 await db('POST','rpc/jin_allocate_referral_rewards',{p_referrer:key});
 const all=await readAll('jin_referral_bindings?select=referred_id,paid_units,checked_block,qualified_block&referrer_id=eq.'+key+'&order=created_at.asc&limit=10000');
 const rewards=await readAll('jin_referral_rewards?select=group_number,status&referrer_id=eq.'+key+'&limit=10000');
 const visible=all.slice(page*10,page*10+10),keys=visible.map(r=>r.referred_id);
 const identities=keys.length?await db('GET','jin_referral_identities?select=identity_key,handle&identity_key=in.('+keys.join(',')+')'):[];
 const handles=new Map(identities.map(r=>[r.identity_key,r.handle]));
 return reply({handle:handle+'.ai',totalReferrals:all.length,qualifiedReferrals:all.filter(r=>r.paid_units===9).length,earnedJIN:rewards.length*1000,pendingJIN:rewards.filter(r=>r.status!=='confirmed').length*1000,paidJIN:rewards.filter(r=>r.status==='confirmed').length*1000,checkedBlock:confirmed,page,pageSize:10,referrals:visible.map(r=>({handle:(handles.get(r.referred_id)||'unknown')+'.ai',paidUnits:r.paid_units,qualified:r.paid_units===9,checkedBlock:r.checked_block})),payouts:'manual'});
 }catch(e){console.error('Referral request failed',action);return reply({error:String(e.message||'Referral service unavailable').slice(0,180)},400);}finally{provider?.destroy();}
}
Deno.serve(handler);
