import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
const repo=process.cwd();
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'website-test-'));fs.mkdirSync(path.join(tmp,'data'));
const course={id:71,name:'Test course',category:'courses',price:0,pricingType:'free',curriculum:JSON.stringify([{title:'Chapter',lectures:[{id:'lesson1',title:'Lesson',videoUrl:'https://example.test/lesson.mp4'}]}]),exam:JSON.stringify([{question:'Test question',options:['A','B'],correctAnswer:1}])};
fs.writeFileSync(path.join(tmp,'data/vision79_saas.json'),JSON.stringify([course,{...course,id:72,price:10,pricingType:'premium'}]));
fs.writeFileSync(path.join(tmp,'data/vision79_crm_prospects.json'),JSON.stringify([{id:'test-prospect',businessName:'Test prospect',description:'Test only',location:'Castries',category:'IT',leadScore:60,workflowStatus:'discovered'}]));
const gateway=createServer((req,res)=>{req.resume();res.writeHead(401,{'Content-Type':'application/json'});res.end('{"error":"test rejection"}');});
await new Promise<void>(r=>gateway.listen(0,'127.0.0.1',r));
const gatewayPort=(gateway.address() as any).port;
const port=33000+Math.floor(Math.random()*5000),base=`http://127.0.0.1:${port}`;
const env={...process.env,NODE_ENV:'production',PORT:String(port),CLIENT_DIST:path.join(repo,'dist/client'),CANONICAL_DOMAIN:base,CAPTCHA_MODE:'disabled',ADMIN_PASSWORD:'Initial-test-password-123!',ADMIN_RESET_TOKEN:'',ENCRYPTION_KEY:crypto.randomBytes(32).toString('hex'),V79TIQUET_INTAKE_URL:`http://127.0.0.1:${gatewayPort}/intake`,V79TIQUET_INTAKE_SECRET:'test',GEMINI_API_KEY:''};
let logs='';let child:ReturnType<typeof spawn>;
async function start(){child=spawn(process.execPath,[path.join(repo,'dist/server/server.cjs')],{cwd:tmp,env,stdio:['ignore','pipe','pipe']});child.stdout!.on('data',d=>logs+=d);child.stderr!.on('data',d=>logs+=d);for(let i=0;i<100;i++){try{if((await fetch(base+'/api/ready')).ok)return;}catch{}if(child.exitCode!==null)throw Error(logs);await new Promise(r=>setTimeout(r,50));}throw Error('Startup timeout: '+logs);}
async function stop(){if(child.exitCode!==null || child.signalCode!==null)return;child.kill();await new Promise(r=>child.once('exit',r));}
class Client {cookie='';async call(url:string,method='GET',body?:unknown,extra:Record<string,string>={}){const r=await fetch(base+url,{method,headers:{Origin:base,...(body===undefined?{}:{'Content-Type':'application/json'}),...(this.cookie?{Cookie:this.cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});const c=r.headers.get('set-cookie');if(c)this.cookie=c.split(';')[0];const text=await r.text();let data:any;try{data=JSON.parse(text)}catch{}return {status:r.status,data,text,headers:r.headers};}}
const anon=new Client(),admin=new Client(),student=new Client();
await test('production regression suite',{timeout:30000},async t=>{
 try {await start();
 await t.test('private artifacts, security headers and routes',async()=>{
  for(const url of ['/server.cjs','/server.cjs.map','/server/server.cjs','/unknown-page','/api/unknown'])assert.equal((await anon.call(url)).status,404,url);
  assert.equal((await anon.call('/api/admin/leads')).status,401);
  const adminPage=await anon.call('/admin');
  assert.equal(adminPage.status,200);
  assert.equal(adminPage.headers.get('x-robots-tag'),'noindex, nofollow, noarchive');
  assert.ok(adminPage.text.includes('name="robots" content="noindex, nofollow, noarchive, noimageindex"'));
  const health=await anon.call('/api/health');
  assert.equal(health.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal(health.headers.get('cross-origin-opener-policy'),'same-origin');
  assert.equal(health.headers.get('x-permitted-cross-domain-policies'),'none');
  const services=await anon.call('/services');
  assert.equal(services.status,200);
  assert.ok(services.text.includes(`<link rel="canonical" href="${base}/services" />`));
  assert.ok(services.text.includes('IT, Cloud, Cybersecurity &amp; Automation Services | V79 Digital'));
  const privacy=await anon.call('/privacy.html');
  assert.equal(privacy.status,200);
  assert.ok(privacy.text.includes('Privacy Notice'));
  const sitemap=await anon.call('/sitemap.xml');
  assert.equal(sitemap.status,200);
  assert.ok(sitemap.text.includes(`${base}/privacy.html`));
 });
 await t.test('admin cookies, forced password change and CSRF',async()=>{let r=await admin.call('/api/admin/login','POST',{password:env.ADMIN_PASSWORD});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie')!,/HttpOnly/);assert.match(r.headers.get('set-cookie')!,/Secure/);assert.equal(r.data.token,'cookie-session');assert.equal((await admin.call('/api/admin/leads')).status,403);r=await admin.call('/api/admin/change-password','POST',{currentPassword:env.ADMIN_PASSWORD,newPassword:'Changed-test-password-456!'});assert.equal(r.status,200);assert.equal((await admin.call('/api/admin/leads')).status,200);assert.equal((await admin.call('/api/admin/logout','POST',{}, {Origin:'https://attacker.test'})).status,403);});
 await t.test('malformed contacts cannot crash; delivery rejection remains failed',async()=>{assert.equal((await anon.call('/api/leads','POST',{name:{},company:'T',email:'x@y.test',phone:'0'})).status,400);assert.equal((await anon.call('/api/health')).status,200);const r=await anon.call('/api/leads','POST',{name:'Test Contact',company:'Test Co',email:'contact@example.test',phone:'000000000'});assert.equal(r.status,201);await new Promise(r=>setTimeout(r,100));const leads=await admin.call('/api/admin/leads');assert.equal(leads.data[0].tiquetSyncStatus,'failed');});
 await t.test('CRM stage and approval are durable and idempotent',async()=>{const leads=await admin.call('/api/admin/crm/leads');const list=Array.isArray(leads.data)?leads.data:leads.data.leads;assert.ok(list?.length);assert.equal((await admin.call(`/api/admin/crm/leads/${list[0].id}/stage`,'PUT',{stage:'Researching'})).status,200);const first=await admin.call('/api/admin/crm/prospects/test-prospect/approve','POST',{});assert.equal(first.status,200);const second=await admin.call('/api/admin/crm/prospects/test-prospect/approve','POST',{});assert.equal(second.status,200);assert.equal(first.data.id,second.data.id);});
 await t.test('storage failure rolls back lead capture and fails readiness',async()=>{
 const sql=new DatabaseSync(path.join(tmp,'data/website.db'));
 const before=(await admin.call('/api/admin/leads')).data.length;
 try{sql.exec("CREATE TRIGGER fail_writes BEFORE INSERT ON documents BEGIN SELECT RAISE(ABORT,'simulated write failure'); END;");assert.equal((await anon.call('/api/leads','POST',{name:'Cannot save',company:'Test',email:'failure@example.test',phone:'00'})).status,500);assert.equal((await anon.call('/api/ready')).status,503);assert.equal((await admin.call('/api/admin/leads')).data.length,before);}finally{sql.exec('DROP TRIGGER fail_writes');sql.close();}
 assert.equal((await anon.call('/api/ready')).status,200);
 });
 await t.test('contact retries do not duplicate and counters do not leak answers',async()=>{
 const request={name:'Retry test',company:'Retry Company',email:'retry@example.test',phone:'0000'},headers={'Idempotency-Key':crypto.randomUUID()};
 const first=await anon.call('/api/leads','POST',request,headers),second=await anon.call('/api/leads','POST',request,headers);assert.equal(first.status,201);assert.equal(second.status,200);assert.equal(first.data.id,second.data.id);
 const counter=await anon.call('/api/apps/increment','POST',{id:71});assert.equal(counter.status,200);assert.equal(counter.text.includes('correctAnswer'),false);
 });
 await t.test('no public answers, history or client-forged passes' ,async()=>{const r=await anon.call('/api/apps');assert.equal(r.status,200);assert.ok(!r.text.includes('correctAnswer'));assert.equal((await anon.call('/api/exam/attempts')).status,401);assert.equal((await anon.call('/api/exam/attempt','POST',{appId:71,passed:true,score:'100/100'})).status,401);});
 await t.test('learner enrollment, grading, persistence, paid approval and recovery',async()=>{let r=await student.call('/api/student/register','POST',{name:'Test Learner',email:'learner@example.test',password:'Learner-password-123!'});assert.equal(r.status,201);const recovery=r.data.recoveryCode,id=r.data.id;assert.equal((await student.call('/api/student/courses/71/enroll','POST')).status,200);assert.equal((await student.call('/api/student/courses/71/progress','PUT',{completed:{lesson1:true},note:'Private note'})).status,200);r=await student.call('/api/exam/attempt','POST',{appId:71,answers:[1],passed:false});assert.equal(r.status,201);assert.equal(r.data.passed,true);assert.ok(r.data.certificate.id);assert.equal((await anon.call('/api/certificates/'+r.data.certificate.id)).data.valid,true);r=await student.call('/api/student/courses/72/enroll','POST');assert.equal(r.data.state.enrolled,false);assert.equal((await student.call('/api/student/courses/72')).text.includes('https://example.test/lesson.mp4'),false);assert.equal((await admin.call('/api/admin/enrollments','POST',{studentId:id,courseId:72})).status,200);assert.equal((await student.call('/api/student/courses/72')).text.includes('https://example.test/lesson.mp4'),true);await stop();await start();assert.equal((await student.call('/api/student/courses/71')).data.state.note,'Private note');assert.equal((await student.call('/api/student/recover','POST',{email:'learner@example.test',recoveryCode:recovery,password:'Recovered-password-123!'})).status,200);});
 await t.test('migration encrypts contact data and retains encrypted originals',()=>{const data=path.join(tmp,'data');assert.ok(fs.existsSync(path.join(data,'website.db')));assert.ok(fs.existsSync(path.join(data,'vision79_saas.json.migrated.enc')));assert.equal(fs.existsSync(path.join(data,'vision79_saas.json')),false);for(const name of fs.readdirSync(data).filter(x=>x.endsWith('.db')||x.endsWith('-wal')||x.endsWith('.enc')))assert.equal(fs.readFileSync(path.join(data,name)).includes(Buffer.from('contact@example.test')),false);});
 await t.test('account isolation and server-enforced failed-attempt cooldown',async()=>{
 const other=new Client();assert.equal((await other.call('/api/student/register','POST',{name:'Other Learner',email:'other@example.test',password:'Different-password-123!'})).status,201);
 assert.equal((await other.call('/api/student/courses/71')).data.state.note,'');await other.call('/api/student/courses/71/enroll','POST');await other.call('/api/student/courses/71/progress','PUT',{completed:{lesson1:true},note:''});
 const failed=await other.call('/api/exam/attempt','POST',{appId:71,answers:[0],passed:true,score:'100/100'});assert.equal(failed.data.passed,false);assert.equal((await other.call('/api/exam/attempt','POST',{appId:71,answers:[1]})).status,429);
 });
 await t.test('configured CAPTCHA rejects absent tokens' ,async()=>{await stop();env.CAPTCHA_MODE='required';await start();assert.equal((await anon.call('/api/leads','POST',{name:'T',company:'T',email:'t@example.test',phone:'000000'})).status,400);});
 }catch(e){console.error(logs.slice(-2500));throw e;}finally{await stop();gateway.close();fs.rmSync(tmp,{recursive:true,force:true});}
});
