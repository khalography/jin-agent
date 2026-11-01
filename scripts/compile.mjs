import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
export let standardJsonInput;
export function compile(extra={}) {
 const input={language:'Solidity',sources:{'JinMint.sol':{content:fs.readFileSync('contracts/JinMint.sol','utf8')},...extra},settings:{optimizer:{enabled:true,runs:200},evmVersion:'paris',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','metadata']}}}};
 const out=JSON.parse(solc.compile(JSON.stringify(input),{import:p=>{try{const contents=fs.readFileSync(path.join('node_modules',p),'utf8');input.sources[p]={content:contents};return{contents}}catch{return{error:'Import not found: '+p}}}}));
 const errors=(out.errors||[]).filter(x=>x.severity==='error');if(errors.length)throw Error(errors.map(x=>x.formattedMessage).join('\n'));
 standardJsonInput=input;return out.contracts;
}
if(process.argv[1]?.endsWith('compile.mjs')){
 const c=compile()['JinMint.sol'].JinMint;fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/JinMint.json',JSON.stringify({compiler:solc.version(),abi:c.abi,bytecode:'0x'+c.evm.bytecode.object,metadata:JSON.parse(c.metadata)},null,2));
 fs.writeFileSync('artifacts/standard-input.json',JSON.stringify(standardJsonInput,null,2));
 fs.copyFileSync('node_modules/ethers/dist/ethers.min.js','dist/assets/ethers.min.js');
 fs.copyFileSync('artifacts/JinMint.json','dist/JinMint.json');
 console.log('Compiled JinMint; ABI and bytecode saved. Wallet library bundled locally.');
}
