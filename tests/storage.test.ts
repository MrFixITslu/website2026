import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const repo=process.cwd();
test('storage corruption and transaction safeguards',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'website-storage-'));
 try{
 const script=`import assert from 'node:assert/strict';import fs from 'node:fs';import {readJSON,writeJSON,transaction} from ${JSON.stringify(path.join(repo,'server/persistence.ts'))};
 writeJSON('transaction.json',{value:1});assert.throws(()=>transaction(()=>{writeJSON('transaction.json',{value:2});throw Error('rollback')}));assert.equal(readJSON('transaction.json',{}).value,1);
 fs.writeFileSync('data/broken.json','not json');assert.throws(()=>readJSON('data/broken.json',[]));assert.equal(fs.readFileSync('data/broken.json','utf8'),'not json');
 fs.writeFileSync('data/rollback-legacy.json','[{"record":1}]');assert.throws(()=>transaction(()=>{readJSON('data/rollback-legacy.json',[]);throw Error('rollback migration')}));assert.ok(fs.existsSync('data/rollback-legacy.json'));
 assert.throws(()=>transaction(()=>Promise.resolve()));
 `;
 const result=spawnSync(process.execPath,['--import',path.join(repo,'node_modules/tsx/dist/loader.mjs'),'--input-type=module','-e',script],{cwd:tmp,env:{...process.env,ENCRYPTION_KEY:'a'.repeat(64)},encoding:'utf8'});assert.equal(result.status,0,result.stderr);
 const wrong=spawnSync(process.execPath,['--import',path.join(repo,'node_modules/tsx/dist/loader.mjs'),'--input-type=module','-e',`import ${JSON.stringify(path.join(repo,'server/persistence.ts'))}`],{cwd:tmp,env:{...process.env,ENCRYPTION_KEY:'b'.repeat(64)},encoding:'utf8'});assert.notEqual(wrong.status,0,'A wrong key must fail startup');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
