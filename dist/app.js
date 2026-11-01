const en={navMint:'Mint',navHow:'How it works',navRules:'Mechanics',connect:'Connect wallet',headline:'Little identity.<br>Golden possibilities<span>.</span>',intro:'Meet JIN, your little on-chain companion.<br>Made for Agent ID holders.<br>A new community starts with a unique you.',start:'Explore the mint',learn:'Meet JIN',note:'One identity. A whole new on-chain journey.',totalUnits:'TOTAL MINT UNITS',units:'units',price:'PRICE PER PAID UNIT',allocation:'TOKENS PER UNIT',network:'NETWORK',mintTitle:'Your golden beginning.',mintSubtitle:'Connect your wallet. Verify your identity.<br>Start a journey that is uniquely yours.',prelaunch:'TBA · MINT CLOSED',collectionName:'Little JIN. Big possibilities.',collectionCopy:'More than an address. A new beginning.',mintPanel:'Mint your JIN',progress:'Mint progress',pendingData:'Reading on-chain status…',paid:'Paid mint',free:'Free claim',quantity:'Mint quantity',paidQuota:'Up to 9 paid units per Agent ID',receive:'You receive',total:'Total payment',connectMint:'Connect wallet to begin',gas:'Network gas is separate · Confirm each transaction in your wallet',launchNote:'Contract deployed and source verified. Mint opening is TBA; minting is closed.',howTitle:'Three steps to your little JIN.',step1:'Connect your wallet',step1Copy:'Connect a BNB Chain compatible wallet. Your assets stay under your control.',step2:'Verify your Agent ID',step2Copy:'Eligibility is checked against an on-chain identity registry. Quotas follow the identity.',step3:'Claim your allocation',step3Copy:'Choose a free claim or paid mint. Review the amount and confirm in your wallet.',rulesTitle:'Simple rules.<br>A clear beginning.',rulesCopy:'Supply and pricing, out in the open.<br>After launch, the contract is the source of truth.',spec:'Read the launch specification',freeSupply:'Free allocation',onePer:'1 unit per Agent ID',paidSupply:'Paid allocation',unit:'unit',tokenSupply:'Mint token allocation',chain:'Network / Chain ID',contract:'Contract status',notDeployed:'Deployed · Mint closed',faqTitle:'A little curious?',faqIntro:'A few things you might want to know.',q1:'Who can participate?',a1:'Wallets holding a .ai Agent ID claimed inside the Binance App can participate. Each mint checks name ownership and remaining quota on-chain.',q2:'How do free claims and paid mints differ?',a2:'There are 4,444 free units, capped at 1 per identity, and 10,000 paid units, capped at 9 per identity. Paid units cost 0.002 BNB each. Both deliver 1,000 JIN per unit and require network gas.',q3:'Can I mint right now?',a3:'The contract is deployed, but minting has not opened. Opening time is TBA. No mint transaction is submitted before opening.',q4:'Is this an official Binance project?',a4:'JIN Agent is an independent community project, with no Binance affiliation or endorsement. The token promises no returns, listing, or liquidity.',closingTitle:'The next story starts with you.',closingLink:'Meet your JIN',footerCopy:'Independent community project · Not affiliated with Binance',docs:'Launch specification'};
Object.assign(en,{agentTitle:'Let your AI agent do the minting.',agentIntro:'Copy this prompt into your preferred AI assistant. It will read the launch instructions, check eligibility, and ask you to confirm before each transaction.',agentGuide:'Agent instructions · llms.txt',promptLabel:'Your minting prompt',copyPrompt:'Copy prompt'});
Object.assign(en,{poolMilestone:'Pool opens at 10,000 mints',poolMilestoneNote:'Counted in paid mint units',poolThreshold:'Pool opening threshold',poolMethod:'Paid units sold out · Manual opening',qPool:'When does the pool open?',aPool:'The pool opens after all 10,000 paid mint units are sold out. Free claims do not count toward this threshold. Pool opening is manual and is not triggered automatically by the mint contract. The trading pair address will be published after opening.'});
Object.assign(en,{agentHandleLabel:'Binance Agent ID (.ai name)',agentHandleHint:'Enter the Agent ID claimed inside the Binance App'});
Object.assign(en,{prelaunch:'TBA · MINT CLOSED',pendingData:'Reading on-chain status…',launchNote:'Contract deployed and source verified. Mint opening is TBA; minting is closed.',notDeployed:'Deployed · Mint closed',a1:'Wallets holding a .ai Agent ID claimed inside the Binance App can participate. Each mint checks name ownership and remaining quota on-chain.',a3:'The contract is deployed, but minting has not opened. Opening time is TBA. No mint transaction is submitted before opening.',verifiedContract:'Contract & verification',verifiedSource:'Verified source · Sourcify'});
let mintReady=false;
const zh={};document.querySelectorAll('[data-t]').forEach(el=>zh[el.dataset.t]=el.innerHTML);
let lang='zh',mode='paid',account=null,busy=false,provider,contract,ethers;
const cfg=window.JIN_CONFIG,qty=document.querySelector('#quantity');
let confirmedOpening=0,publicRefreshBusy=false,lastWalletViewKey="";
const plannedOpening=Number(cfg.launchTime)||0;
const say=(cn,eng)=>document.querySelector('#walletStatus').textContent=lang==='zh'?cn:eng;
function setQuantity(value){const max=mode==='free'?1:9;qty.value=Math.max(1,Math.min(max,Math.trunc(Number(value)||1)));renderQuantity();}
function renderQuantity(){const n=Number(qty.value);document.querySelector('#receive').textContent=(n*1000).toLocaleString('en-US')+' JIN';document.querySelector('#cost').textContent=mode==='free'?'0':(n*2/1000).toFixed(3);document.querySelector('#minus').disabled=n<=1||mode==='free';document.querySelector('#plus').disabled=n>=(mode==='free'?1:9);document.querySelectorAll('[data-qty]').forEach(b=>{b.classList.toggle('selected',Number(b.dataset.qty)===n);b.disabled=mode==='free'});document.querySelector('#quotaText').textContent=mode==='free'?(lang==='zh'?'每个 Agent ID 最多 1 份':'1 free unit per Agent ID'):(lang==='zh'?'每个 Agent ID 最多 9 份':'Up to 9 paid units per Agent ID');qty.readOnly=mode==='free';renderAgentPrompt();}
function renderWallet(){
 const opening=confirmedOpening||plannedOpening,remaining=Math.max(0,opening-Math.floor(Date.now()/1000));
 mintReady=confirmedOpening>0&&remaining===0;
 const button=document.querySelector('#mintButton');button.disabled=busy||!mintReady;
 button.classList.toggle('counting-down',remaining>0);
 if(remaining>0){
  const days=Math.floor(remaining/86400),hours=Math.floor(remaining%86400/3600),minutes=Math.floor(remaining%3600/60),seconds=remaining%60;
  const clock=[hours,minutes,seconds].map(n=>String(n).padStart(2,'0')).join(':');
  button.textContent=(lang==='zh'?'距铸造开启 ':'Mint opens in ')+(days?days+(lang==='zh'?'天 ':'d '):'')+clock;
 }else button.textContent=!mintReady?(lang==='zh'?'等待链上开铸确认':'Awaiting on-chain opening'):(account?(lang==='zh'?'核验并铸造':'Verify & mint'):(lang==='zh'?'连接钱包铸造':'Connect wallet to mint'));
 // Countdown ticks must not rewrite translated/static content every second.
 const viewKey=[lang,account,busy,mintReady,opening].join('|');
 if(viewKey===lastWalletViewKey)return;
 lastWalletViewKey=viewKey;
 document.querySelector('header .wallet').textContent=account?account.slice(0,6)+'…'+account.slice(-4):(lang==='zh'?'连接钱包':'Connect wallet');
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
document.querySelector('#minus').onclick=()=>setQuantity(Number(qty.value)-1);document.querySelector('#plus').onclick=()=>setQuantity(Number(qty.value)+1);qty.onchange=()=>setQuantity(qty.value);document.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>setQuantity(b.dataset.qty));
function selectMode(next){mode=next;document.querySelector('#freeTab').classList.toggle('selected',mode==='free');document.querySelector('#paidTab').classList.toggle('selected',mode==='paid');setQuantity(1);}
document.querySelector('#freeTab').onclick=()=>selectMode('free');document.querySelector('#paidTab').onclick=()=>selectMode('paid');
async function loadChain(){if(!cfg.mintAddress)return;ethers??=await import('./assets/ethers.min.js');provider=new ethers.BrowserProvider(window.ethereum);const signer=await provider.getSigner();contract=new ethers.Contract(cfg.mintAddress,['function paidMint(uint256 quantity,string handle) payable','function claimFree(string handle)','function paidMinted() view returns(uint256)','function freeMinted() view returns(uint256)','function eligibility(address wallet,string handle) view returns(bytes32 identity,uint256 freeRemaining,uint256 paidRemaining)','function opensAt() view returns(uint64)','function PRICE() view returns(uint256)','function FREE_CAP() view returns(uint256)','function PAID_CAP() view returns(uint256)','function TOKENS_PER_UNIT() view returns(uint256)','function AGENT_ID() view returns(address)'],signer);const code=await provider.getCode(cfg.mintAddress);if(code==='0x')throw Error('Contract not found');const [paid,free,price,freeCap,paidCap,tokensPerUnit,agentIdRegistry]=await Promise.all([contract.paidMinted(),contract.freeMinted(),contract.PRICE(),contract.FREE_CAP(),contract.PAID_CAP(),contract.TOKENS_PER_UNIT(),contract.AGENT_ID()]);if(price!==2000000000000000n||freeCap!==4444n||paidCap!==10000n||tokensPerUnit!==1000000000000000000000n||agentIdRegistry.toLowerCase()!=='0x60b9262456de011f7d15a54cdd8c48baaa8b022f')throw Error('Contract configuration mismatch');document.querySelector('#supply').textContent=Number(paid+free).toLocaleString('en-US')+' / 14,444';document.querySelector('#progressBar').style.width=Number(paid+free)/14444*100+'%';}
async function connect(){if(!window.ethereum){say('未检测到兼容钱包。请使用安装了 EVM 钱包的浏览器，或在钱包内打开本站。','No compatible wallet detected. Open this site in an EVM wallet browser or install a compatible wallet.');document.querySelector('#mint').scrollIntoView({behavior:'smooth'});return false;}const accounts=await window.ethereum.request({method:'eth_requestAccounts'});if(!accounts[0])return false;account=accounts[0];renderWallet();if(!cfg.mintAddress){say('钱包已连接。合约尚未部署：未请求签名或付款。','Wallet connected. Contracts are not deployed; no signature or payment requested.');return true;}let chain=await window.ethereum.request({method:'eth_chainId'});if(BigInt(chain)!==BigInt(cfg.chainId)){await window.ethereum.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x'+cfg.chainId.toString(16)}]});}await loadChain();return true;}
async function handleWallet(event){if(busy)return;busy=true;try{if(!account){await connect();return;}if(event.currentTarget.id!=='mintButton'){say('钱包已连接：'+account,'Connected: '+account);return;}if(!cfg.mintAddress){say('合约部署完成前无法铸造。本站不会接收付款。','Minting is unavailable until contract deployment. This site cannot accept payment.');return;}await connect();const handle=document.querySelector('#agentHandle').value.trim().toLowerCase().replace(/\.ai$/,'');if(!/^[a-z0-9]{3,15}$/.test(handle))throw Error(lang==='zh'?'请填写有效的 Binance .ai Agent ID。':'Enter a valid Binance .ai Agent ID.');const [identity,freeRemaining,paidRemaining]=await contract.eligibility(account,handle);const opening=await contract.opensAt();if(opening===0n||BigInt(Math.floor(Date.now()/1000))<opening)throw Error(lang==='zh'?'链上铸造尚未开启。':'On-chain minting has not opened.');if(identity===ethers.ZeroHash)throw Error(lang==='zh'?'当前钱包没有有效 Agent ID。':'No valid Agent ID found for this wallet.');const n=BigInt(qty.value);if((mode==='free'?freeRemaining:paidRemaining)<n)throw Error(lang==='zh'?'剩余身份额度或供应不足。':'Insufficient identity quota or remaining supply.');say('正在模拟交易…','Simulating transaction…');let tx;if(mode==='free'){await contract.claimFree.staticCall(handle);tx=await contract.claimFree(handle);}else{const value=n*2000000000000000n;await contract.paidMint.staticCall(n,handle,{value});tx=await contract.paidMint(n,handle,{value});}say('交易已提交，等待确认：'+tx.hash,'Transaction submitted, awaiting confirmation: '+tx.hash);await tx.wait();await loadChain();say('铸造成功！交易：'+tx.hash,'Mint confirmed! Transaction: '+tx.hash);}catch(error){const rejected=error.code===4001||error.code==='ACTION_REJECTED';say(rejected?'你已取消钱包请求。':('操作未完成：'+(error.shortMessage||error.message)),rejected?'Wallet request cancelled.':('Unable to complete: '+(error.shortMessage||error.message)));}finally{busy=false;renderWallet();}}
document.querySelectorAll('.wallet').forEach(b=>b.addEventListener('click',handleWallet));
if(window.ethereum?.on){window.ethereum.on('accountsChanged',accounts=>{account=accounts[0]||null;contract=null;renderWallet();say('钱包账户已更新，请重新核验。','Wallet account updated. Reconnect to verify.');});window.ethereum.on('chainChanged',()=>{contract=null;say('网络已更改，请重新核验。','Network changed. Reconnect to verify.');});}
setQuantity(1);

function renderAgentPrompt(){
 const origin=location.origin,n=Number(qty.value),cost=(n*2/1000).toFixed(3);const handle=document.querySelector('#agentHandle').value.trim().toLowerCase().replace(/\.ai$/,'');const identityHint=/^[a-z0-9]{3,15}$/.test(handle)?(lang==='zh'?`我的 Binance Agent ID 是 ${handle}.ai。`:`My Binance Agent ID is ${handle}.ai.`):'';
 const action=mode==='free'
  ?(lang==='zh'?'如果我有资格且还有免费份额，请领取 1 份免费额度；不要进行付费铸造。':'If I am eligible and free supply remains, claim 1 free unit; do not perform a paid mint.')
  :(lang==='zh'?`如果符合资格，先领取尚未领取的 1 份免费额度（若有），再付费铸造 ${n} 份，每份 0.002 BNB，付费总额不超过 ${cost} BNB，Gas 费另计。若额度不足，请先向我说明，不要自行调整份数。`:`If eligible, first claim my unclaimed free unit if available, then mint ${n} paid unit(s) at 0.002 BNB each, for a maximum mint payment of ${cost} BNB plus network gas. If my quota is insufficient, explain it to me before changing the quantity.`);
 document.querySelector('#agentPrompt').value=lang==='zh'
 ?`请阅读 ${origin}/llms.txt，帮助我用当前连接的钱包在 BNB Smart Chain（Chain ID 56）参与「金小灵 JIN Agent」铸造。${identityHint}先检查上线状态、已验证合约、Agent ID 资格、剩余额度及供应。${action}合约地址只使用官方配置中已核验的地址；若尚未部署或信息缺失，立即停止，不要猜测地址或发起付款。每笔交易先模拟，向我展示操作、合约地址、金额与 Gas 估算，再让我在钱包中确认签名。不要索取私钥或助记词。`
 :`Read ${origin}/llms.txt and help me participate in the JIN Agent mint with my currently connected wallet on BNB Smart Chain (chain ID 56). ${identityHint} First check launch status, the verified contract, Agent ID eligibility, remaining quota, and supply. ${action} Use only the verified contract address in the official configuration. If the contract is not deployed or required information is missing, stop; do not guess an address or send payment. Simulate every transaction, show me the action, contract address, payment and estimated gas, then ask me to confirm in my wallet. Never request my private key or recovery phrase.`;
 document.querySelector('#promptStatus').textContent='';
}
document.querySelector('#copyPrompt').addEventListener('click',async()=>{
 const field=document.querySelector('#agentPrompt'),status=document.querySelector('#promptStatus');
 try{await navigator.clipboard.writeText(field.value);status.textContent=lang==='zh'?'已复制，发送给你的 AI Agent 即可。':'Copied. Send it to your AI agent.';}
 catch{field.focus();field.select();status.textContent=lang==='zh'?'提示词已选中，请手动复制。':'Prompt selected. Copy it manually.';}
});

document.querySelector('#agentHandle').addEventListener('input',renderAgentPrompt);

async function refreshPublicState(){
 if(publicRefreshBusy)return;publicRefreshBusy=true;let publicProvider;
 try{
  ethers??=await import('./assets/ethers.min.js');const request=new ethers.FetchRequest(cfg.rpcUrl);request.timeout=12000;
  publicProvider=new ethers.JsonRpcProvider(request,cfg.chainId,{staticNetwork:true});
  const read=new ethers.Contract(cfg.mintAddress,['function paidMinted() view returns(uint256)','function freeMinted() view returns(uint256)','function opensAt() view returns(uint64)'],publicProvider);
  const [paid,free,opening]=await Promise.all([read.paidMinted(),read.freeMinted(),read.opensAt()]);
  confirmedOpening=Number(opening);
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
