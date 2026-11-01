import fs from 'node:fs';
import {JsonRpcProvider,FetchRequest,Contract,ContractFactory,concat,getCreate2Address,id,keccak256,formatEther} from 'ethers';
const signer=process.argv[2];
if(!/^0x[0-9a-fA-F]{40}$/.test(signer||''))throw Error('Supply the connected Binance Agentic Wallet BSC address.');
const proxy='0x4e59b44847b379578588920ca78fbf26c0b4956c';
const expectedProxyCode='0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3';
const registry='0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F';
const request=new FetchRequest(process.env.JIN_RPC_URL||'https://bsc-dataseed.bnbchain.org');request.timeout=30000;
const provider=new JsonRpcProvider(request,56,{staticNetwork:true});
try{
 console.log('Checking BSC chain and deployment proxy…');
 if(BigInt(await provider.send('eth_chainId',[]))!==56n)throw Error('Wrong chain');
 const block=await provider.getBlockNumber();const proxyCode=await provider.getCode(proxy,block);if(proxyCode!==expectedProxyCode)throw Error('Deployment proxy bytecode does not match its published source.');
 const agent=new Contract(registry,['function ownerOf(uint256) view returns(address)','function name() view returns(string)'],provider);
 console.log('Checking Binance Agent ID ownership…');
 const actualOwner=await agent.ownerOf(BigInt(id('caligraphy')),{blockTag:block});if(actualOwner.toLowerCase()!==signer.toLowerCase())throw Error('Connected signer does not own caligraphy.ai.');
 const artifact=JSON.parse(fs.readFileSync('artifacts/JinMint.json','utf8'));const factory=new ContractFactory(artifact.abi,artifact.bytecode);
 const init=(await factory.getDeployTransaction(signer)).data;
 const salt=id('JIN Agent genesis / BSC / 1000 JIN per unit / treasury '+signer.toLowerCase());
 const address=getCreate2Address(proxy,salt,keccak256(init));if(await provider.getCode(address)!=='0x')throw Error('Predicted contract already exists; inspect it before any deployment retry.');
 console.log('Simulating deterministic deployment and estimating gas…');
 const inputData=concat([salt,init]);const tx={from:signer,to:proxy,value:0n,data:inputData};const gas=await provider.estimateGas(tx);const gasPrice=BigInt(await provider.send('eth_gasPrice',[]));const balance=await provider.getBalance(signer);
 const result={chainId:56,signer,treasury:signer,proxy,proxyCodeHash:keccak256(proxyCode),registry,registryName:await agent.name(),registryCodeHash:keccak256(await provider.getCode(registry,block)),checkedAtBlock:block,contractAddress:address,salt,initCodeHash:keccak256(init),value:'0',inputData,estimatedGas:gas.toString(),gasPriceWei:gasPrice.toString(),estimatedFeeBNB:formatEther(gas*gasPrice),balanceBNB:formatEther(balance),compiler:artifact.compiler,opensAt:0,priceBNB:'0.002',tokensPerUnit:1000,freeUnits:4444,paidUnits:10000,maximumMintAllocation:14444000,manualPoolAtPaidUnits:10000};
 fs.writeFileSync('artifacts/deployment.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({...result,inputData:'[saved in artifacts/deployment.json]'},null,2));
}finally{provider.destroy();}
