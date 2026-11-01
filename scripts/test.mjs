import assert from 'node:assert/strict';
import ganache from '@ganache/core';
import {BrowserProvider,Contract,ContractFactory,parseEther,ZeroHash,id,concat,getCreate2Address,keccak256} from 'ethers';
import {compile} from './compile.mjs';
const REGISTRY='0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F';
const PROXY='0x4e59b44847b379578588920ca78fbf26c0b4956c';
const PROXY_CODE='0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe03601600081602082378035828234f58015156039578182fd5b8082525050506014600cf3';
const compiled=compile({'Test.sol':{content:`// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import "JinMint.sol";
contract MockAgentIds {mapping(uint256=>address) public owners;function set(string calldata handle,address wallet) external {owners[uint256(keccak256(bytes(handle)))]=wallet;}function ownerOf(uint256 tokenId) external view returns(address){require(owners[tokenId]!=address(0));return owners[tokenId];}}
contract BoundaryHarness is JinMint {constructor(address payable treasury) JinMint(treasury){}function setCounters(uint256 f,uint256 p) external {freeMinted=f;paidMinted=p;}}
`}});
const engine=ganache.provider({logging:{quiet:true},wallet:{totalAccounts:6},chain:{hardfork:'shanghai'}});
const provider=new BrowserProvider(engine);provider.pollingInterval=20;
const [owner,a,b,c,d]=await Promise.all([0,1,2,3,4].map(x=>provider.getSigner(x)));
const ownerAddress=await owner.getAddress();
async function deploy(name,args=[],file='JinMint.sol'){const code=compiled[file][name];const result=await new ContractFactory(code.abi,'0x'+code.evm.bytecode.object,owner).deploy(...args);await result.waitForDeployment();return result;}
async function fail(call,label){await assert.rejects(async()=>{const tx=await call();if(tx?.wait)await tx.wait();},undefined,label);}
const mock=await deploy('MockAgentIds',[],'Test.sol');await engine.request({method:'evm_setAccountCode',params:[REGISTRY,await provider.getCode(await mock.getAddress())]});
const registry=new Contract(REGISTRY,compiled['Test.sol'].MockAgentIds.abi,owner);
await(await registry.set('alpha',await a.getAddress())).wait();await(await registry.set('beta',await c.getAddress())).wait();
const mint=await deploy('JinMint',[ownerAddress]);assert.equal(await mint.treasury(),ownerAddress);assert.equal(await mint.opensAt(),0n);assert.equal(await mint.TOKENS_PER_UNIT(),parseEther('1000'));
await fail(()=>mint.connect(a).claimFree('alpha'),'TBA closed');await fail(()=>mint.connect(a).scheduleMint(4000000000),'unauthorized launch');await fail(()=>mint.scheduleMint(0),'zero launch');await fail(()=>mint.scheduleMint(1),'past launch');
async function openMint(target){const block=await engine.request({method:'eth_getBlockByNumber',params:['latest',false]});await(await target.scheduleMint(Number(BigInt(block.timestamp))+5)).wait();await engine.request({method:'evm_increaseTime',params:[6]});await engine.request({method:'evm_mine',params:[]});}
await openMint(mint);await fail(()=>mint.scheduleMint(4000000000),'schedule only once');
for(const handle of ['missing','Alpha','alpha.ai','ab','toolongagenthandle123','alpha!'])await fail(()=>mint.connect(a).claimFree(handle),'invalid/unowned handle');
await fail(()=>mint.connect(d).paidMint(1,'alpha',{value:parseEther('0.002')}),'wrong wallet');
await fail(()=>mint.connect(a).paidMint(1,'alpha',{value:parseEther('0.001')}),'underpay');await fail(()=>mint.connect(a).paidMint(1,'alpha',{value:parseEther('0.003')}),'overpay');await fail(()=>mint.connect(a).paidMint(0,'alpha'),'zero quantity');await fail(()=>mint.connect(a).paidMint(10,'alpha',{value:parseEther('0.020')}),'oversized quantity');
await(await mint.connect(a).claimFree('alpha')).wait();await(await mint.connect(a).paidMint(5,'alpha',{value:parseEther('0.010')})).wait();
await(await registry.set('alpha',await b.getAddress())).wait();await fail(()=>mint.connect(a).paidMint(1,'alpha',{value:parseEther('0.002')}),'old owner rejected');await fail(()=>mint.connect(b).claimFree('alpha'),'identity free quota survives owner change');await(await mint.connect(b).paidMint(4,'alpha',{value:parseEther('0.008')})).wait();await fail(()=>mint.connect(b).paidMint(1,'alpha',{value:parseEther('0.002')}),'identity paid quota survives owner change');
assert.equal(await mint.balanceOf(await a.getAddress()),parseEther('6000'));assert.equal(await mint.totalSupply(),parseEther('10000'));assert.equal(await mint.paidMinted(),9n);assert.equal(await mint.freeMinted(),1n);assert.equal((await mint.eligibility(await b.getAddress(),'alpha')).paidRemaining,0n);assert.equal((await mint.eligibility(await a.getAddress(),'alpha')).identity,ZeroHash);
await(await mint.connect(a).transfer(await c.getAddress(),parseEther('1'))).wait();assert.equal(await mint.balanceOf(await c.getAddress()),parseEther('1'));await fail(()=>mint.connect(a).withdraw(),'treasury only');await(await mint.withdraw()).wait();assert.equal(BigInt(await engine.request({method:'eth_getBalance',params:[await mint.getAddress(),'latest']})),0n);
const future=await deploy('JinMint',[ownerAddress]);await(await future.scheduleMint(4000000000)).wait();await fail(()=>future.connect(c).claimFree('beta'),'future launch gate');
const boundary=await deploy('BoundaryHarness',[ownerAddress],'Test.sol');await openMint(boundary);await(await boundary.setCounters(4443,9999)).wait();await(await boundary.connect(c).claimFree('beta')).wait();await(await boundary.connect(c).paidMint(1,'beta',{value:parseEther('0.002')})).wait();assert.equal(await boundary.freeMinted(),4444n);assert.equal(await boundary.paidMinted(),10000n);await fail(()=>boundary.connect(b).claimFree('alpha'),'free cap');await fail(()=>boundary.connect(b).paidMint(1,'alpha',{value:parseEther('0.002')}),'paid cap');
await engine.request({method:'evm_setAccountCode',params:[PROXY,PROXY_CODE]});const code=compiled['JinMint.sol'].JinMint;const factory=new ContractFactory(code.abi,'0x'+code.evm.bytecode.object,owner);const init=(await factory.getDeployTransaction(ownerAddress)).data;const salt=id('JIN deployment test');const predicted=getCreate2Address(PROXY,salt,keccak256(init));await(await owner.sendTransaction({to:PROXY,data:concat([salt,init])})).wait();const viaProxy=new Contract(predicted,code.abi,provider);assert.equal(await viaProxy.treasury(),ownerAddress);assert.equal(await viaProxy.opensAt(),0n);assert.equal(await viaProxy.AGENT_ID(),REGISTRY);
await provider.destroy();await engine.disconnect();console.log('PASS: Binance .ai ownership/handle checks, stable ID quotas, 1,000 JIN delivery, exact payment, TBA/one-time launch, both supply caps, treasury access, transfers, and deterministic deployment preserving signer treasury.');
