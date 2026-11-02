import {startMintTracker} from './mint-tracker.js';
import {mintPlan} from './mint-plan.js';
const en={navMint:'Mint',navHow:'How it works',navRules:'Mechanics',connect:'Connect',headline:'Little identity.<br>Golden possibilities<span>.</span>',intro:'Meet JIN, your little on-chain companion.<br>Made for Agent ID holders.<br>A new community starts with a unique you.',start:'Explore the mint',learn:'Meet JIN',note:'One identity. A whole new on-chain journey.',totalUnits:'TOTAL MINT UNITS',units:'units',price:'PRICE PER PAID UNIT',allocation:'TOKENS PER UNIT',network:'NETWORK',mintTitle:'Your golden beginning.',mintSubtitle:'Enter your Agent ID. Choose your mint quantity.<br>Let your AI agent take it from here.',prelaunch:'TBA · MINT CLOSED',collectionName:'Little JIN. Big possibilities.',collectionCopy:'More than an address. A new beginning.',mintPanel:'Mint your $JIN',progress:'Mint progress',pendingData:'Reading on-chain status…',paid:'Paid mint',free:'Free claim',quantity:'Mint quantity',paidQuota:'Up to 9 paid units per Agent ID',receive:'You receive',total:'Total payment',connectMint:'Connect wallet to begin',gas:'Network gas is separate · Confirm each transaction in your wallet',launchNote:'Contract deployed and source verified. Mint opening is TBA; minting is closed.',howTitle:'Three steps to your little JIN.',step1:'Connect your wallet',step1Copy:'Connect a BNB Chain compatible wallet. Your assets stay under your control.',step2:'Verify your Agent ID',step2Copy:'Eligibility is checked against an on-chain identity registry. Quotas follow the identity.',step3:'Claim your allocation',step3Copy:'Choose a free claim or paid mint. Review the amount and confirm in your wallet.',rulesTitle:'Simple rules.<br>A clear beginning.',rulesCopy:'Supply and pricing, out in the open.<br>After launch, the contract is the source of truth.',spec:'Read the launch specification',freeSupply:'Free allocation',onePer:'1 unit per Agent ID',paidSupply:'Paid allocation',unit:'unit',tokenSupply:'Mint token allocation',chain:'Network / Chain ID',contract:'Contract status',notDeployed:'Deployed · Mint closed',faqTitle:'A little curious?',faqIntro:'A few things you might want to know.',q1:'Who can participate?',a1:'Wallets holding a .ai Agent ID claimed inside the Binance App can participate. Each mint checks name ownership and remaining quota on-chain.',q2:'How do free claims and paid mints differ?',a2:'There are 4,444 free units, capped at 1 per identity, and 10,000 paid units, capped at 9 per identity. Paid units cost 0.002 BNB each. Both deliver 1,000 $JIN per unit and require network gas.',q3:'Can I mint right now?',a3:'The contract is deployed, but minting has not opened. Opening time is TBA. No mint transaction is submitted before opening.',q4:'Is this an official Binance project?',a4:'JIN Agent is an independent community project, with no Binance affiliation or endorsement. The token promises no returns, listing, or liquidity.',closingTitle:'The next story starts with you.',closingLink:'Meet your JIN',footerCopy:'Independent community project · Not affiliated with Binance',docs:'Launch specification'};
Object.assign(en,{agentTitle:'Let your AI agent do the minting.',agentIntro:'Copy this prompt into your preferred AI assistant. It will read the launch instructions, check eligibility, and ask you to confirm before each transaction.',agentGuide:'Agent instructions · llms.txt',promptLabel:'Your minting prompt',copyPrompt:'Copy prompt'});
Object.assign(en,{poolMilestone:'Pool opens at 10,000 mints',poolMilestoneNote:'Counted in paid mint units',poolThreshold:'Pool opening threshold',poolMethod:'Paid units sold out',qPool:'When does the pool open?',aPool:'The pool opens after all 10,000 paid mint units are sold out. Free claims do not count toward this threshold. Pool opening is manual and is not triggered automatically by the mint contract. The trading pair address will be published after opening.'});
Object.assign(en,{agentHandleLabel:'Binance Agent ID (.ai name)',agentHandleHint:'Enter the Agent ID claimed inside the Binance App'});
Object.assign(en,{prelaunch:'TBA · MINT CLOSED',pendingData:'Reading on-chain status…',launchNote:'Contract deployed and source verified. Mint opening is TBA; minting is closed.',notDeployed:'Deployed · Mint closed',a1:'Wallets holding a .ai Agent ID claimed inside the Binance App can participate. Each mint checks name ownership and remaining quota on-chain.',a3:'The contract is deployed, but minting has not opened. Opening time is TBA. No mint transaction is submitted before opening.',verifiedContract:'Contract & verification',verifiedSource:'Verified source · Sourcify'});
Object.assign(en,{marketSoon:'SOON',marketName:'Companion Market',holderLabel:'HOLDER BENEFITS',holderTitle:'Hold 9,000 $JIN',holderCopy:'Share a <b>25%</b> pool of mint revenue and a <b>10%</b> pool of our Companion Market revenue.',benefitNote:'Distribution mechanics and eligibility details will be announced.'});
Object.assign(en,{referEarn:'Refer to earn'});
let mintReady=false;
let shareStarted=false,shareConfirmed=false;
const zh={};document.querySelectorAll('[data-t]').forEach(el=>zh[el.dataset.t]=el.innerHTML);
let lang='zh',account=null,busy=false,provider,contract,ethers;
const cfg=window.JIN_CONFIG,qty=document.querySelector('#quantity');
let confirmedOpening=0,publicRefreshBusy=false,lastWalletViewKey="";
const plannedOpening=Number(cfg.launchTime)||0;
let eligibilityState=null,globalFreeRemaining=cfg.freeSupplyExhausted?0:null,eligibilityRequest=0,eligibilityTimer;
const currentPlan=()=>mintPlan(qty.value,eligibilityState,globalFreeRemaining);
Object.assign(en,{step3Copy:'Choose your total units. If eligible, one unit is free and the rest are paid.',quantity:'Total mint units',total:'Mint payment',connectMint:'Get mint prompt'});
const say=(cn,eng)=>document.querySelector('#walletStatus').textContent=lang==='zh'?cn:eng;
function setQuantity(value){const max=Math.max(1,currentPlan().max);qty.value=Math.max(1,Math.min(max,Math.trunc(Number(value)||1)));renderQuantity();}
function renderQuantity(){
 let p=currentPlan();const cn=lang==='zh';if(p.total>Math.max(1,p.max)){qty.value=Math.max(1,p.max);p=currentPlan();}qty.max=Math.max(1,p.max);
 document.querySelector('#receive').textContent=(p.total*1000).toLocaleString('en-US')+' $JIN';
 document.querySelector('#cost').textContent=p.cost;
 document.querySelector('#breakdownLabel').textContent=cn?'份额组合':'Allocation';
 document.querySelector('#breakdown').textContent=cn?`${p.free} 免费 + ${p.paid} 付费`:`${p.free} free + ${p.paid} paid`;
 document.querySelector('#minus').disabled=p.total<=1;document.querySelector('#plus').disabled=p.total>=p.max;
 document.querySelectorAll('[data-qty]').forEach(b=>{const maxButton=b.textContent==='MAX';if(maxButton)b.dataset.qty=String(Math.max(1,p.max));b.classList.toggle('selected',Number(b.dataset.qty)===p.total);b.disabled=p.max===0||Number(b.dataset.qty)>p.max});
 document.querySelector('#quotaText').textContent=cn?'每个 ID：1 免费 + 最多 9 付费':'Per ID: 1 free + up to 9 paid';
 document.querySelector('#allocationNote').textContent=p.max===0?(cn?'此钱包或 ID 没有可用铸造额度。':'No mint quota is available for this wallet or ID.'):!p.valid?(cn?'所选份数超过当前剩余额度，请减少份数。':'Selection exceeds remaining quota. Reduce the quantity.'):
 eligibilityState?(cn?'已查询 ID 额度；Agent 将再次核验钱包归属与供应。':'ID quota checked; your agent will recheck wallet ownership and supply.'):
 p.free?(cn?'可能包含 1 份免费额度，以身份资格及剩余供应为准。请填写 .ai 名称查询。':'May include 1 free unit, subject to eligibility and supply. Enter your .ai name to check.'):
 (cn?'免费供应已用完，所选份额全部付费。':'Free supply is exhausted; all selected units are paid.');
 renderAgentPrompt();
}
function renderWallet(){
 const opening=confirmedOpening||plannedOpening,remaining=Math.max(0,opening-Math.floor(Date.now()/1000));
 mintReady=confirmedOpening>0&&remaining===0;
 const button=document.querySelector('#mintButton');button.disabled=busy||!mintReady;
 button.classList.toggle('counting-down',remaining>0);
 if(remaining>0){
  const days=Math.floor(remaining/86400),hours=Math.floor(remaining%86400/3600),minutes=Math.floor(remaining%3600/60),seconds=remaining%60;
  const clock=[hours,minutes,seconds].map(n=>String(n).padStart(2,'0')).join(':');
  button.textContent=(lang==='zh'?'距铸造开启 ':'Mint opens in ')+(days?days+(lang==='zh'?'天 ':'d '):'')+clock;
 }else button.textContent=!mintReady?(lang==='zh'?'等待链上开铸确认':'Awaiting on-chain opening'):(lang==='zh'?'获取铸造提示词':'Get mint prompt');
 // Countdown ticks must not rewrite translated/static content every second.
 const viewKey=[lang,account,busy,mintReady,opening].join('|');
 if(viewKey===lastWalletViewKey)return;
 lastWalletViewKey=viewKey;
 document.querySelector('header .wallet').textContent=account?account.slice(0,6)+'…'+account.slice(-4):(lang==='zh'?'连接':'Connect');
 const date='2026-11-02 08:00 UTC';
 en.prelaunch=mintReady?'MINT OPEN':'OPENS '+date;zh.prelaunch=mintReady?'铸造已开启':'开启时间 '+date;
 en.notDeployed=mintReady?'Deployed · Mint open':'Deployed · Opens '+date;zh.notDeployed=mintReady?'已部署 · 铸造已开启':'已部署 · '+date+' 开启';
 en.launchNote=mintReady?'Mint is open. Review each transaction in your wallet.':'Mint opens November 2, 2026 at 08:00 UTC. Countdown follows your device clock; the contract controls access.';
 zh.launchNote=mintReady?'铸造已开启。每笔交易均由你在钱包内确认。':'铸造将于 2026 年 11 月 2 日 08:00 UTC 开启。倒计时以设备时间计算，实际开放以链上合约为准。';
 en.a3=mintReady?'Minting is open. Connect your wallet and verify your Binance Agent ID.':'Minting opens November 2, 2026 at 08:00 UTC. The mint button shows the countdown; transactions remain disabled until the on-chain opening.';
 zh.a3=mintReady?'铸造已开启。请连接钱包并核验 Binance Agent ID。':'铸造将于 2026 年 11 月 2 日 08:00 UTC 开启。铸造按钮显示倒计时，链上正式开启前无法提交铸造交易。';
 document.querySelectorAll('[data-t="prelaunch"],[data-t="notDeployed"],[data-t="launchNote"],[data-t="a3"]').forEach(el=>el.innerHTML=(lang==='en'?en:zh)[el.dataset.t]);
}
document.querySelector('#lang').addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.body.classList.toggle('en',lang==='en');document.querySelectorAll('[data-t]').forEach(el=>el.innerHTML=(lang==='en'?en:zh)[el.dataset.t]);document.querySelector('#lang span').textContent=lang==='zh'?'EN':'中文';document.querySelector('#lang').ariaLabel=lang==='zh'?'Switch to English':'切换为中文';renderQuantity();renderWallet();renderTheme();document.querySelector('#walletStatus').textContent='';});
document.querySelector('#minus').onclick=()=>setQuantity(Number(qty.value)-1);document.querySelector('#plus').onclick=()=>setQuantity(Number(qty.value)+1);qty.onchange=()=>setQuantity(qty.value);document.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>setQuantity(b.textContent==='MAX'?Math.max(1,currentPlan().max):b.dataset.qty));
async function loadChain(){if(!cfg.mintAddress)return;ethers??=await import('./assets/ethers.min.js');provider=new ethers.BrowserProvider(window.ethereum);const signer=await provider.getSigner();contract=new ethers.Contract(cfg.mintAddress,['function paidMint(uint256 quantity,string handle) payable','function claimFree(string handle)','function paidMinted() view returns(uint256)','function freeMinted() view returns(uint256)','function eligibility(address wallet,string handle) view returns(bytes32 identity,uint256 freeRemaining,uint256 paidRemaining)','function opensAt() view returns(uint64)','function PRICE() view returns(uint256)','function FREE_CAP() view returns(uint256)','function PAID_CAP() view returns(uint256)','function TOKENS_PER_UNIT() view returns(uint256)','function AGENT_ID() view returns(address)'],signer);const code=await provider.getCode(cfg.mintAddress);if(code==='0x')throw Error('Contract not found');const [paid,free,price,freeCap,paidCap,tokensPerUnit,agentIdRegistry]=await Promise.all([contract.paidMinted(),contract.freeMinted(),contract.PRICE(),contract.FREE_CAP(),contract.PAID_CAP(),contract.TOKENS_PER_UNIT(),contract.AGENT_ID()]);if(price!==2000000000000000n||freeCap!==4444n||paidCap!==10000n||tokensPerUnit!==1000000000000000000000n||agentIdRegistry.toLowerCase()!=='0x60b9262456de011f7d15a54cdd8c48baaa8b022f')throw Error('Contract configuration mismatch');document.querySelector('#supply').textContent=Number(paid+free).toLocaleString('en-US')+' / 14,444';document.querySelector('#progressBar').style.width=Number(paid+free)/14444*100+'%';}
async function connect(){if(!window.ethereum){say('未检测到兼容钱包。请使用安装了 EVM 钱包的浏览器，或在钱包内打开本站。','No compatible wallet detected. Open this site in an EVM wallet browser or install a compatible wallet.');document.querySelector('#mint').scrollIntoView({behavior:'smooth'});return false;}const accounts=await window.ethereum.request({method:'eth_requestAccounts'});if(!accounts[0])return false;account=accounts[0];renderWallet();if(!cfg.mintAddress){say('钱包已连接。合约尚未部署：未请求签名或付款。','Wallet connected. Contracts are not deployed; no signature or payment requested.');return true;}let chain=await window.ethereum.request({method:'eth_chainId'});if(BigInt(chain)!==BigInt(cfg.chainId)){await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x'+cfg.chainId.toString(16)}]});}await loadChain();return true;}
async function handleWallet(event){
 if(event.currentTarget.id==='mintButton'){
  if(!mintReady)return;
  document.querySelector('.agent-mint').scrollIntoView({behavior:'smooth',block:'center'});
  document.querySelector(currentPlan().free&&!shareConfirmed?'#shareOnX':'#copyPrompt').focus({preventScroll:true});return;
 }
 if(busy)return;busy=true;
 try{await connect();await checkEligibility();}
 catch(e){say('连接未完成：'+(e.shortMessage||e.message),'Unable to connect: '+(e.shortMessage||e.message));}
 finally{busy=false;renderWallet();}
}
document.querySelectorAll('.wallet').forEach(b=>b.addEventListener('click',handleWallet));
if(window.ethereum?.on){window.ethereum.on('accountsChanged',accounts=>{account=accounts[0]||null;contract=null;eligibilityState=null;eligibilityRequest++;renderQuantity();checkEligibility();renderWallet();say('钱包账户已更新，请重新核验。','Wallet account updated. Reconnect to verify.');});window.ethereum.on('chainChanged',()=>{contract=null;eligibilityState=null;eligibilityRequest++;renderQuantity();say('网络已更改，请重新核验。','Network changed. Reconnect to verify.');});}
setQuantity(9);

function renderAgentPrompt(){
 const origin=location.origin,p=currentPlan(),n=p.total,cost=p.cost;const handle=document.querySelector('#agentHandle').value.trim().toLowerCase().replace(/\.ai$/,'');const identityHint=/^[a-z0-9]{3,15}$/.test(handle)?(lang==='zh'?`我的 Binance Agent ID 是 ${handle}.ai。`:`My Binance Agent ID is ${handle}.ai.`):'';
 const action=lang==='zh'
 ?`我希望总共获得 ${n} 份（${n*1000} $JIN），不是在所选份数之外额外领取免费额度。当前报价为 ${p.free} 免费 + ${p.paid} 付费，付费上限 ${cost} BNB，Gas 另计。${p.estimated?'该报价尚待资格核验。':''}如果该身份尚未领取免费份额且供应仍有剩余，请先模拟并领取 1 份免费额度，等待成功回执，再为剩余 ${n-1} 份进行付费铸造；若没有免费资格，只有在总付费不超过上述上限且额度足够时才可全部付费，否则先征求我同意。若免费领取失败或供应耗尽，不得擅自增加付费金额。若免费成功但付费失败，记录免费交易哈希，核验回执、最新额度与供应，仅重试未完成的付费部分；不得重复免费领取或重复付款。若仅选择 1 份且免费领取成功，不得再提交付费交易。混合铸造需要两笔独立交易与分别确认，完成每笔后报告进度。`
 :`I want exactly ${n} total unit(s), delivering ${n*1000} $JIN, including any free unit, not an extra free unit on top. The current quote is ${p.free} free + ${p.paid} paid, with a maximum mint payment of ${cost} BNB plus gas. ${p.estimated?'This quote is subject to eligibility verification. ':''}If my ID has an unclaimed free unit and free supply remains, simulate and claim 1 free unit first, wait for a successful receipt, then mint the remaining ${n-1} paid unit(s). If no free unit is available, mint all units as paid only if within the stated payment limit and quota; otherwise ask me first. If the free claim fails or supply runs out, never increase payment without my approval. If the free claim succeeds but paid minting fails, record the free transaction hash, verify receipts, remaining quota and supply, and retry only the unfinished paid portion. Never duplicate claims or payments. If the total is 1 and the free claim succeeds, do not send a paid transaction. A mixed selection requires two separate transactions and confirmations; report progress after each.`;
 document.querySelector('#agentPrompt').value=lang==='zh'
 ?`请阅读 ${origin}/llms.txt，帮助我用当前连接的钱包在 BNB Smart Chain（Chain ID 56）参与「金小灵 JIN Agent」铸造。${identityHint}先检查上线状态、已验证合约、Agent ID 资格、剩余额度及供应。${action}合约地址只使用官方配置中已核验的地址；若尚未部署或信息缺失，立即停止，不要猜测地址或发起付款。每笔交易先模拟，向我展示操作、合约地址、金额与 Gas 估算，再让我在钱包中确认签名。不要索取私钥或助记词。`
 :`Read ${origin}/llms.txt and help me participate in the JIN Agent mint with my currently connected wallet on BNB Smart Chain (chain ID 56). ${identityHint} First check launch status, the verified contract, Agent ID eligibility, remaining quota, and supply. ${action} Use only the verified contract address in the official configuration. If the contract is not deployed or required information is missing, stop; do not guess an address or send payment. Simulate every transaction, show me the action, contract address, payment and estimated gas, then ask me to confirm in my wallet. Never request my private key or recovery phrase.`;
 if(window.JIN_REFERRAL?.instructions)document.querySelector('#agentPrompt').value+=window.JIN_REFERRAL.instructions(lang);
 document.querySelector('#promptStatus').textContent='';
 renderShareGate();
}
document.querySelector('#copyPrompt').addEventListener('click',async()=>{
 if((currentPlan().free&&!shareConfirmed)||!currentPlan().valid)return;
 const field=document.querySelector('#agentPrompt'),status=document.querySelector('#promptStatus');
 try{await navigator.clipboard.writeText(field.value);status.textContent=lang==='zh'?'已复制，发送给你的 AI Agent 即可。':'Copied. Send it to your AI agent.';}
 catch{field.focus();field.select();status.textContent=lang==='zh'?'提示词已选中，请手动复制。':'Prompt selected. Copy it manually.';}
});

document.querySelector('#agentHandle').addEventListener('input',()=>{
 eligibilityRequest++;eligibilityState=null;shareStarted=false;shareConfirmed=false;renderQuantity();
 clearTimeout(eligibilityTimer);eligibilityTimer=setTimeout(checkEligibility,500);
});
async function checkEligibility(){
 const handle=document.querySelector('#agentHandle').value.trim().toLowerCase().replace(/\.ai$/,'');
 const ticket=++eligibilityRequest;if(!/^[a-z0-9]{3,15}$/.test(handle)){eligibilityState=null;renderQuantity();return;}
 let readProvider;
 try{
  ethers??=await import('./assets/ethers.min.js');const req=new ethers.FetchRequest(cfg.rpcUrl);req.timeout=12000;
  readProvider=new ethers.JsonRpcProvider(req,cfg.chainId,{staticNetwork:true});
  const registry=new ethers.Contract('0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F',['function ownerOf(uint256) view returns(address)'],readProvider);
  const owner=await registry.ownerOf(BigInt(ethers.id(handle)));
  const read=new ethers.Contract(cfg.mintAddress,['function eligibility(address,string) view returns(bytes32,uint256,uint256)'],readProvider);
  const [identity,free,paid]=await read.eligibility(account||owner,handle);
  if(ticket!==eligibilityRequest)return;
  eligibilityState={free:Number(free),paid:Number(paid)};
 }catch{if(ticket===eligibilityRequest)eligibilityState=null;}
 finally{readProvider?.destroy();if(ticket===eligibilityRequest)renderQuantity();}
}

async function refreshPublicState(){
 if(publicRefreshBusy)return;publicRefreshBusy=true;let publicProvider;
 try{
  ethers??=await import('./assets/ethers.min.js');const request=new ethers.FetchRequest(cfg.rpcUrl);request.timeout=12000;
  publicProvider=new ethers.JsonRpcProvider(request,cfg.chainId,{staticNetwork:true});
  const read=new ethers.Contract(cfg.mintAddress,['function paidMinted() view returns(uint256)','function freeMinted() view returns(uint256)','function opensAt() view returns(uint64)'],publicProvider);
  const [paid,free,opening]=await Promise.all([read.paidMinted(),read.freeMinted(),read.opensAt()]);
  confirmedOpening=Number(opening);globalFreeRemaining=Math.max(0,4444-Number(free));renderQuantity();
  document.querySelector('#supply').textContent=Number(paid+free).toLocaleString('en-US')+' / 14,444';
  document.querySelector('#progressBar').style.width=Number(paid+free)/14444*100+'%';
  en.pendingData='Live on-chain mint units';zh.pendingData='实时链上铸造份额';
 }catch{
  confirmedOpening=0;
  const snapshot=cfg.snapshot;
  if(snapshot){document.querySelector('#supply').textContent=Number(snapshot.freeMinted+snapshot.paidMinted).toLocaleString('en-US')+' / 14,444';en.pendingData='Confirmed at block '+snapshot.blockNumber.toLocaleString('en-US')+' · Live refresh unavailable';zh.pendingData='区块 '+snapshot.blockNumber.toLocaleString('en-US')+' 已核验 · 暂时无法实时刷新';}
  else{en.pendingData='On-chain refresh unavailable · Minting remains disabled';zh.pendingData='暂时无法刷新链上状态 · 铸造保持关闭';}
 }finally{
  publicProvider?.destroy();publicRefreshBusy=false;
  document.querySelector('[data-t="pendingData"]').textContent=(lang==='en'?en:zh).pendingData;renderWallet();
 }
}
renderWallet();refreshPublicState();
setInterval(renderWallet,1000);
setInterval(refreshPublicState,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderWallet();refreshPublicState();}});

function renderTheme(){
 const dark=document.documentElement.dataset.theme!=='light';
 const label=lang==='zh'?(dark?'浅色':'深色'):(dark?'Light':'Dark');
 const button=document.querySelector('#themeToggle');
 document.querySelector('#themeLabel').textContent=label;
 button.firstElementChild.textContent=dark?'☀':'☾';
 button.setAttribute('aria-label',lang==='zh'?`切换为${label}模式`:`Switch to ${label.toLowerCase()} mode`);
 document.querySelector('meta[name="theme-color"]').content=dark?'#111410':'#f6f3eb';
}
document.querySelector('#themeToggle').addEventListener('click',()=>{
 const theme=document.documentElement.dataset.theme==='light'?'dark':'light';
 document.documentElement.dataset.theme=theme;
 try{localStorage.setItem('jin-theme',theme)}catch{}
 renderTheme();
});
renderTheme();

// A self-confirmed share unlocks only the free-claim prompt.
function renderShareGate(){
 const p=currentPlan(),free=p.free>0,locked=free&&!shareConfirmed,cn=lang==='zh';
 document.querySelector('#shareGate').hidden=!locked;
 document.querySelector('#agentPrompt').hidden=locked;
 document.querySelector('#copyPrompt').disabled=locked||!p.valid;
 document.querySelector('#shareTitle').textContent=cn?'分享后，解锁含免费额度的铸造提示词':'Share to unlock your mint prompt';
 document.querySelector('#shareDescription').textContent=cn?'在 X 分享金小灵铸造。发布后返回，点击「我已发布」即可解锁提示词。':'Share the $JIN mint on X. After posting, return here and select “I’ve posted” to unlock your prompt.';
 const share=document.querySelector('#shareOnX');share.textContent=cn?'在 X 发布':'Post on X';
 const configuredOrigin=location.hostname==='localhost'||location.hostname==='127.0.0.1'?'https://jin-agent-id.ivorydulse1.chatgpt.site':location.origin;
 const tweet=cn?'我正在参与金小灵 JIN Agent 铸造！Binance .ai Agent ID 持有者可领取 1 份免费额度，每份 1,000 $JIN。付费铸造每份 0.002 BNB，Gas 另计。#JINAgent #BNBChain':'I’m joining the JIN Agent mint! Binance .ai Agent ID holders can claim 1 free unit of 1,000 $JIN. Paid units cost 0.002 BNB each. Network gas applies. #JINAgent #BNBChain';
 share.href='https://twitter.com/intent/tweet?'+new URLSearchParams({text:tweet,url:configuredOrigin+'/#mint'});
 const confirm=document.querySelector('#confirmShare');confirm.textContent=cn?'我已发布':'I’ve posted';confirm.disabled=!shareStarted;
 document.querySelector('#shareHint').textContent=shareStarted?(cn?'完成发布后，返回此处确认。':'Finish your post, then return here to confirm.'):(cn?'先点击「在 X 发布」。':'Start by selecting “Post on X”.');
}
document.querySelector('#shareOnX').addEventListener('click',()=>{shareStarted=true;renderShareGate();});
document.querySelector('#confirmShare').addEventListener('click',()=>{
 if(!shareStarted)return;
 shareConfirmed=true;renderShareGate();
 document.querySelector('#promptStatus').textContent=lang==='zh'?'感谢分享！现在可以复制铸造提示词。':'Thanks for sharing! Your mint prompt is ready to copy.';
 document.querySelector('#copyPrompt').focus();
});

startMintTracker(window.JIN_CONFIG,()=>lang);

import('./holders.js').then(({startHolders})=>startHolders(window.JIN_CONFIG,()=>lang)).catch(()=>{document.querySelector('#holdersStatus').textContent=lang==='zh'?'持有者列表暂时无法加载。':'Holder list is temporarily unavailable.';});

import('./referrals.js').then(({startReferrals})=>{startReferrals(()=>lang);renderAgentPrompt();}).catch(()=>{});
