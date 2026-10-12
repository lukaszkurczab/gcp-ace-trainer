// Read-only capability: fixed local emulator + exact native target; stdout contains counts only.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,lstatSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {selectTarget,parseOrigin,request} from './readNativeStartupTrace.mjs';
process.umask(0o077);
let ws,db;
try {
  const [actorPath,outputPath,...extra]=process.argv.slice(2);
  if(!actorPath||!outputPath||extra.length)throw Error('arguments');
  const actor=resolve(actorPath),out=resolve(outputPath);
  for(const [p,mode,dir]of[[actor,0o700,true],[out,0o700,true],[join(actor,'credentials.json'),0o600,false]]){
    const s=lstatSync(p);if(s.uid!==process.getuid()||realpathSync(p)!==p||(s.mode&0o777)!==mode||s.isDirectory()!==dir)throw Error('private_path');
  }
  process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:18081';
  const require=createRequire(new URL('../../../patternly-backend/package.json',import.meta.url));
  const{initializeApp}=require('firebase-admin/app');const{getFirestore}=require('firebase-admin/firestore');
  db=getFirestore(initializeApp({projectId:'patternly-app-sandbox'},'ch07-readonly'));
  const c=JSON.parse(readFileSync(join(actor,'credentials.json')));
  const mapping=await db.collection('identityMappings').where('subject','==',c.uid).limit(2).get();
  if(mapping.size!==1||typeof mapping.docs[0].data().userId!=='string')throw Error('identity_not_unique');
  const accountHash=createHash('sha256').update(mapping.docs[0].data().userId).digest('hex');
  const origin=parseOrigin('http://127.0.0.1:8082');
  const target=selectTarget(await(await fetch(new URL('/json/list',origin),{signal:AbortSignal.timeout(5000)})).json(),origin);
  const wsRequire=createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json',import.meta.url));const WS=wsRequire('ws');
  ws=new WS(target,{origin:origin.origin,handshakeTimeout:5000,followRedirects:false,maxPayload:128*1024});
  await new Promise((a,b)=>{ws.once('open',a);ws.once('error',b)});
  // Hermes CDP does not await promises reliably. Poll the fixed, RAM-only result.
  const expression=`(()=>{const key='__patternlyCh07ProfileMatchV1';if(globalThis[key]!==undefined)throw Error('busy');globalThis[key]={state:'pending'};Promise.resolve().then(async()=>{const e=Array.from(__r.getModules().entries());const load=s=>{const m=e.filter(([,v])=>v.isInitialized&&v.verboseName?.endsWith(s));if(m.length!==1)throw Error('owner_unavailable');return __r(m[0][0])};if(!__DEV__||!load('src/infrastructure/runtime/runtimeMode.ts').isPatternlySmokeRuntime())throw Error('runtime_rejected');const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;const state=await load('src/infrastructure/storage/mmkvClient.ts').inspectPreparedProfileState();globalThis[key]={state:'done',value:{selectedProfileMatchesAccount:state.selectedProfile.kind==='account'&&hash(state.selectedProfile.accountId)===${JSON.stringify(accountHash)},profileCount:state.profiles.length,guestCount:state.profiles.filter(p=>p.kind==='guest').length,matchingAccountCount:state.profiles.filter(p=>p.kind==='account'&&hash(p.accountId)===${JSON.stringify(accountHash)}).length}}}).catch(()=>{globalThis[key]={state:'failed'}});return 'scheduled'})()`;
  let id=1;
  const evaluate=async expression=>{const r=await request(ws,id++,'Runtime.evaluate',{expression,returnByValue:true,silent:true});if(r.error||r.result?.exceptionDetails)throw Error('read_rejected');return r.result?.result?.value};
  if(await evaluate(expression)!=='scheduled')throw Error('read_rejected');
  let value;
  for(let n=0;n<20;n++){
    const r=JSON.parse(await evaluate("JSON.stringify(globalThis.__patternlyCh07ProfileMatchV1)"));
    if(r.state==='failed')throw Error('owner_read_failed');
    if(r.state==='done'){value=r.value;break;}
    await new Promise(a=>setTimeout(a,100));
  }
  if(!value||!Number.isInteger(value.profileCount)||value.guestCount!==1||![0,1].includes(value.matchingAccountCount))throw Error('read_rejected');
  await evaluate("delete globalThis.__patternlyCh07ProfileMatchV1;true");
  writeFileSync(join(out,'account-match.json'),JSON.stringify(value),{mode:0o600,flag:'wx'});
  console.log(JSON.stringify(value));
}catch{console.error(JSON.stringify({stage:'ch07_profile_match',category:'read_stopped'}));process.exitCode=1;}
finally{ws?.terminate();await db?.terminate();}
