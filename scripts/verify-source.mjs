import fs from 'node:fs';
const deployment=JSON.parse(fs.readFileSync('artifacts/deployment-confirmed.json','utf8'));
const artifact=JSON.parse(fs.readFileSync('artifacts/JinMint.json','utf8'));
const body={stdJsonInput:JSON.parse(fs.readFileSync('artifacts/standard-input.json','utf8')),compilerVersion:artifact.compiler.split('.Emscripten')[0],contractIdentifier:'JinMint.sol:JinMint',creationTransactionHash:deployment.txHash};
const response=await fetch('https://sourcify.dev/server/v2/verify/56/'+deployment.contractAddress,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(60000)});
const result=await response.json();fs.writeFileSync('artifacts/source-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!response.ok)process.exitCode=1;
