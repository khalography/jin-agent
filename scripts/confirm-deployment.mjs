import fs from 'node:fs';
import {JsonRpcProvider,FetchRequest,Contract,keccak256,formatEther} from 'ethers';
const deployment=JSON.parse(fs.readFileSync('artifacts/deployment.json','utf8'));
const artifact=JSON.parse(fs.readFileSync('artifacts/JinMint.json','utf8'));
const txHash=process.argv[2];if(!/^0x[0-9a-fA-F]{64}$/.test(txHash||''))throw Error('Supply the broadcast transaction hash.');
const request=new FetchRequest(process.env.JIN_RPC_URL||'https://bsc-rpc.publicnode.com');request.timeout=30000;
const provider=new JsonRpcProvider(request,56,{staticNetwork:true});
try{
 console.log('Waiting for BSC transaction receipt…');
 const receipt=await provider.waitForTransaction(txHash,1,120000);if(!receipt||receipt.status!==1)throw Error('Deployment transaction did not succeed.');
 const tx=await provider.getTransaction(txHash);if(tx.from.toLowerCase()!==deployment.signer.toLowerCase()||tx.to.toLowerCase()!==deployment.proxy.toLowerCase()||tx.data!==deployment.inputData||tx.value!==0n)throw Error('Confirmed transaction differs from approved deployment.');
 const code=await provider.getCode(deployment.contractAddress,receipt.blockNumber);if(code==='0x')throw Error('No contract code at the predicted address.');
 const c=new Contract(deployment.contractAddress,artifact.abi,provider);
 const [treasury,registry,price,unit,freeCap,paidCap,opensAt,totalSupply,freeMinted,paidMinted,eligibility]=await Promise.all([c.treasury(),c.AGENT_ID(),c.PRICE(),c.TOKENS_PER_UNIT(),c.FREE_CAP(),c.PAID_CAP(),c.opensAt(),c.totalSupply(),c.freeMinted(),c.paidMinted(),c.eligibility(deployment.signer,'caligraphy')]);
 if(treasury.toLowerCase()!==deployment.signer.toLowerCase()||registry.toLowerCase()!==deployment.registry.toLowerCase()||price!==2000000000000000n||unit!==1000000000000000000000n||freeCap!==4444n||paidCap!==10000n||opensAt!==0n||totalSupply!==0n||freeMinted!==0n||paidMinted!==0n||eligibility.freeRemaining!==1n||eligibility.paidRemaining!==9n)throw Error('Deployed settings or eligibility mismatch.');
 const result={status:'CONFIRMED',txHash,contractAddress:deployment.contractAddress,blockNumber:receipt.blockNumber,blockHash:receipt.blockHash,treasury,registry,priceBNB:formatEther(price),tokensPerUnit:formatEther(unit),freeCap:String(freeCap),paidCap:String(paidCap),opensAt:String(opensAt),totalSupply:String(totalSupply),freeMinted:String(freeMinted),paidMinted:String(paidMinted),signerEligibility:{identity:eligibility.identity,freeRemaining:String(eligibility.freeRemaining),paidRemaining:String(eligibility.paidRemaining)},runtimeCodeHash:keccak256(code),gasUsed:String(receipt.gasUsed),gasPriceWei:String(receipt.gasPrice),actualFeeBNB:formatEther(receipt.gasUsed*receipt.gasPrice)};
 fs.writeFileSync('artifacts/deployment-confirmed.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{provider.destroy();}
