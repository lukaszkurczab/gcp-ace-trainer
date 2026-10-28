/** Normal F01 handoff capture on the existing approved actor. No training/domain action.
 * Requires the real SDK baseline before any public preference write and the completed preview.
 * Logical inventory restoration uses the independently reviewed lease-fenced canonical clear API.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createConnection} from 'node:net';
import {assertReadyRestorationBaseline} from './readStartupReadyPreservation.mjs';
import {inspectStartupReadyPrimary} from './startupReadyViewport.mjs';
const [device,output,resumeMode]=process.argv.slice(2),node='/opt/homebrew/opt/node@22/bin/node';
if((resumeMode!==undefined&&resumeMode!=='--resume-home')||process.argv.slice(2).length>3||device!=='7F315654-3175-4F3C-BB24-B0263F59360C'||!output||!resolve(output).startsWith(resolve('.agent/private')+'/'))throw Error('ready_capture_arguments');
const out=resolve(output),sha=value=>createHash('sha256').update(value).digest('hex'),read=name=>JSON.parse(readFileSync(resolve(out,name),'utf8'));
const save=(name,value)=>{const p=resolve(out,name);mkdirSync(resolve(p,'..'),{recursive:true});writeFileSync(p,JSON.stringify(value,null,2)+'\n');};
const baseline=read('normal-sdk-baseline.json'),actor=read('normal-ready-approved-actor.json'),candidate=read('candidate-4-source.json');
if(read('launcher-regular.json').mode!=='regular'||read('preview-completion-check.json').images!==588||baseline.settings!==null||baseline.profileHash!==actor.expectedProfileCanonicalHash||baseline.activeProfileIdHash!==actor.expectedActiveProfileIdHash)throw Error('ready_capture_baseline');
for(const [path,hash] of Object.entries(candidate.sources))if(sha(readFileSync(path))!==hash)throw Error('ready_capture_source_drift');
const locales=[...readFileSync('src/preferences/localeResolver.ts','utf8').match(/TARGET_LOCALES = \[(.*?)\]/)[1].matchAll(/"([a-z]{2})"/g)].map(x=>x[1]);
// English was selected through the actual UI before this controller; its default is a no-op.
const orderedLocales=['en',...locales.filter(x=>x!=='en')];
let stop=false;process.on('SIGTERM',()=>{stop=true;});process.on('SIGINT',()=>{stop=true;});
const run=(command,args,log)=>{const r=spawnSync(command,args,{encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});if(log)writeFileSync(resolve(out,log),(r.stdout??'')+(r.stderr??''));if(r.status!==0)throw Error('ready_capture_command:'+log);return r.stdout;};
const sdk=name=>{const x=JSON.parse(run(node,['scripts/qa/readStartupReadyPreservation.mjs','read'],name+'.log'));save(name+'.json',x);assertReadyRestorationBaseline(baseline,x);return x;};
const flow=(name,tag,env=[])=>run('maestro',['--device',device,'test','--no-reinstall-driver','scripts/qa/'+name+'.yaml',...env,'--test-output-dir',resolve(out,'normal-runs-v2',tag)],'normal-v2-'+tag+'.log');
const apiAbsent=()=>new Promise((accept,reject)=>{const socket=createConnection({host:'127.0.0.1',port:8080});socket.once('connect',()=>{socket.destroy();reject(Error('ready_api_present'));});socket.once('error',error=>{socket.destroy();error.code==='ECONNREFUSED'?accept(true):reject(Error('ready_api_probe_uncertain'));});socket.setTimeout(2000,()=>{socket.destroy();reject(Error('ready_api_probe_timeout'));});});
const records=resumeMode?read('matrix-normal-progress.json'):[];let failure=null;
const captureToolSha256=sha(readFileSync(new URL(import.meta.url))),visibilityHelperSha256=sha(readFileSync('scripts/qa/startupReadyViewport.mjs'));
const resumeKeys=new Set();for(const r of records){const binding=[r.locale,r.theme,r.text].join('|');if(resumeKeys.has(binding)||!locales.includes(r.locale)||!['light','dark'].includes(r.theme)||!['standard','large'].includes(r.text))throw Error('ready_resume_binding');resumeKeys.add(binding);if(r.candidateFingerprint!==candidate.fingerprint)throw Error('ready_resume_candidate');for(const k of ['image','receipt','hierarchy',...(r.footer?['footer','footer_hierarchy']:[]),...(r.visibilityProof?['visibilityProof']:[])]){const path=resolve(out,r[k]);if(!path.startsWith(out+'/')||sha(readFileSync(path))!==r[k==='image'?'sha256':k+'_sha256'])throw Error('ready_resume_artifact');}const receipt=JSON.parse(readFileSync(resolve(out,r.receipt)));assertReadyRestorationBaseline(baseline,receipt);if(receipt.i18n!==r.locale||(receipt.settings?.language??'en')!==r.locale||receipt.osAppearance!==r.theme||(r.text==='standard'?receipt.window.fontScale!==1:receipt.window.fontScale<3))throw Error('ready_resume_parameters');if(!inspectStartupReadyPrimary(JSON.parse(readFileSync(resolve(out,r.footer_hierarchy??r.hierarchy))),receipt.window).fullyVisible)throw Error('ready_resume_primary_occluded');}

try {
 await apiAbsent();save('normal-api-absence.json',{host:'127.0.0.1',port:8080,result:'ECONNREFUSED',claim:'local API absent; no OS radio-off claim',at:new Date().toISOString()});sdk('normal-v2-controller-before');
 // The first public English probe deliberately left its settings screen open.
 if(!resumeMode)flow('startup-ready-return-home','initial-return');else {const hierarchy=run('maestro',['--device',device,'hierarchy','--no-reinstall-driver']);if(!hierarchy.includes('main-tab-bar-home')||!hierarchy.includes('patternly:content:ready'))throw Error('ready_resume_home_boundary');}
 for(const locale of orderedLocales){
  if(records.filter(r=>r.locale===locale).length===4)continue;
  if(stop||existsSync(resolve(out,'normal-capture-stop-requested')))throw Error('ready_capture_stop_boundary');
  run('xcrun',['simctl','ui',device,'content_size','large']);
  flow('startup-ready-select-language','select-'+locale,['-e','LOCALE='+locale]);
  const selection=sdk('normal-v2-selected-'+locale+'-controller');
  if(selection.i18n!==locale||(selection.settings?.language??'en')!==locale)throw Error('ready_public_locale_readback');
  flow('startup-ready-return-home','return-'+locale);
  for(const theme of ['light','dark'])for(const [text,size] of [['standard','large'],['large','accessibility-extra-extra-extra-large']]){
   await new Promise(setImmediate);if(stop||existsSync(resolve(out,'normal-capture-stop-requested')))throw Error('ready_capture_stop_boundary');if(records.some(r=>r.locale===locale&&r.theme===theme&&r.text===text))continue;await apiAbsent();
   run('xcrun',['simctl','ui',device,'appearance',theme]);run('xcrun',['simctl','ui',device,'content_size',size]);
   const variant=locale+'-'+theme+'-'+text,folder=resolve(out,'matrix-normal',variant);mkdirSync(folder,{recursive:true});
   flow('startup-ready-reset-home-top','top-'+variant);
   const receipt=sdk('matrix-normal/'+variant+'/runtime');
   if(receipt.i18n!==locale||(receipt.settings?.language??'en')!==locale||(receipt.settings?.appearance??'system')!=='system'||receipt.osAppearance!==theme||(text==='standard'?receipt.window.fontScale!==1:receipt.window.fontScale<3))throw Error('ready_variant_binding');
   const hierarchy=run('maestro',['--device',device,'hierarchy','--no-reinstall-driver']);JSON.parse(hierarchy);if(!hierarchy.includes('patternly:content:ready')||!hierarchy.includes('main-tab-bar-home'))throw Error('ready_native_boundary');writeFileSync(resolve(folder,'hierarchy.json'),hierarchy);
   run('xcrun',['simctl','io',device,'screenshot',resolve(folder,'ready.png')]);
   const primaryBefore=inspectStartupReadyPrimary(JSON.parse(hierarchy),receipt.window);
   const relative=path=>path.slice(out.length+1),record={captureToolSha256,visibilityHelperSha256,scene:'normal-ready',locale,theme,text,fontScale:receipt.window.fontScale,candidateFingerprint:candidate.fingerprint,image:relative(resolve(folder,'ready.png')),receipt:relative(resolve(folder,'runtime.json')),hierarchy:relative(resolve(folder,'hierarchy.json')),sharedCases:['D19','D20'],bootstrap:'existing normal root after local API-absent launch',scope:'ready handoff and primary Home surface; no full Home feature audit'};
   let primaryAfter=primaryBefore,gestureCount=0;
   if(text==='large'||!primaryBefore.fullyVisible){
    let h=hierarchy;
    while(!primaryAfter.fullyVisible&&gestureCount<2){
     if(!primaryAfter.primary||primaryAfter.primary[1]<0||primaryAfter.primary[0]<0||primaryAfter.primary[2]>receipt.window.width)throw Error('ready_primary_frame_requires_review');
     flow('startup-ready-gutter-scroll',variant+'-gutter-'+(gestureCount+1));gestureCount++;
     h=run('maestro',['--device',device,'hierarchy','--no-reinstall-driver']);JSON.parse(h);primaryAfter=inspectStartupReadyPrimary(JSON.parse(h),receipt.window);
    }
    if(!primaryAfter.fullyVisible)throw Error('ready_primary_still_occluded_after_bounded_scroll');
    writeFileSync(resolve(folder,'primary-hierarchy.json'),h);run('xcrun',['simctl','io',device,'screenshot',resolve(folder,'primary-visible.png')]);record.footer=relative(resolve(folder,'primary-visible.png'));record.footer_hierarchy=relative(resolve(folder,'primary-hierarchy.json'));
   }
   const proof={before:primaryBefore,after:primaryAfter,gestureCount,criterion:'Full primary frame above fixed navigation; physical-window visibility alone is insufficient',limits:'Frame screen only; independent original-image review remains required'};save('matrix-normal/'+variant+'/primary-visibility.json',proof);record.visibilityProof='matrix-normal/'+variant+'/primary-visibility.json';record.visibilityProof_sha256=sha(readFileSync(resolve(out,record.visibilityProof)));
   sdk('matrix-normal/'+variant+'/after');
   for(const key of ['image','receipt','hierarchy',...(record.footer?['footer','footer_hierarchy']:[])])record[key==='image'?'sha256':key+'_sha256']=sha(readFileSync(resolve(out,record[key])));
   records.push(record);save('matrix-normal-progress.json',records);console.log('captured normal '+records.length+'/28 '+variant);
  }
 }
}catch(error){failure=error.message;save('normal-controller-failure.json',{stage:failure});throw error;}
finally{
 try{const restored=JSON.parse(run(node,['scripts/qa/readStartupReadyPreservation.mjs','restore-settings',resolve(out,'normal-sdk-baseline.json')],'normal-settings-restore.log'));save('normal-settings-restored.json',restored);run('xcrun',['simctl','ui',device,'appearance','dark']);run('xcrun',['simctl','ui',device,'content_size','large']);save('normal-controller-cleanup.json',{failure,records:records.length,restoration:restored.restoration,logicalInventoryExact:JSON.stringify(restored.inventory)===JSON.stringify(baseline.inventory)});}catch{save('normal-controller-cleanup-failure.json',{stage:'lease_fenced_settings_restore_or_os_restore'});throw Error('ready_cleanup_requires_review');}
}
