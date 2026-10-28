/** Existing SDK/repository read; only hashes leave this process.
 * Languages must be selected through the real LanguageSettings UI.
 * restore-settings requires the original absent-settings baseline, all non-settings records,
 * all other profiles/categories and a live storage lease before the canonical clear API.
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { request, selectTarget } from './readNativeStartupTrace.mjs';
const SETTINGS_KEY='patternly:canonical:v1:settings';
const hash=value=>createHash('sha256').update(value).digest('hex');
const ordered=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
function preservedInventory(value) {
 const inventory=value.inventory;
 if(inventory?.kind!=='observed'||!inventory.complete)throw Error('ready_inventory_incomplete');
 const {physicalKeyCount,physicalInventorySha256,profileInventories,...remaining}=inventory;
 return {...remaining,profileInventories:profileInventories.map(profile=>profile.profileIdSha256===value.activeProfileIdHash
  ?{profileIdSha256:profile.profileIdSha256,kind:profile.kind,categoryInventories:profile.categoryInventories.filter(row=>row.category!=='settings')}:profile)};
}
export function assertReadyRestorationBaseline(before,current) {
 if(before.kind!=='startup-ready-preservation.v1'||before.settings!==null||before.recordHashes?.[SETTINGS_KEY]!==undefined)throw Error('ready_original_settings_not_absent');
 if(before.profileHash!==current.profileHash||before.activeProfileIdHash!==current.activeProfileIdHash)throw Error('ready_profile_changed');
 const records=value=>Object.fromEntries(Object.entries(value.recordHashes).filter(([key])=>key!==SETTINGS_KEY));
 if(ordered(records(before))!==ordered(records(current)))throw Error('ready_nonsettings_record_changed');
 if(ordered(preservedInventory(before))!==ordered(preservedInventory(current)))throw Error('ready_foreign_or_nonsettings_inventory_changed');
}
async function runtimeSnapshot(replyKey,allowRestore) {
 const host=globalThis;const symbol=Symbol.for(replyKey);let category="runtime";
 try {
  if(typeof __DEV__==='undefined'||!__DEV__||!host.HermesInternal)throw Error('runtime');
  const load=suffix=>{const matches=Array.from(__r.getModules().entries()).filter(([,v])=>v.isInitialized&&v.verboseName?.endsWith(suffix));if(matches.length!==1)throw Error('owner');return __r(matches[0][0]);};
  if(!load('src/infrastructure/runtime/runtimeMode.ts').isPatternlySmokeRuntime()||typeof host[Symbol.for('patternly.startup-preview-receipt.v1')]==='function')throw Error('mode');
  category='modules';const rn=load('node_modules/react-native/index.js'),settings=load('src/storage/repositories/settingsRepository.ts'),owner=load('src/storage/repositories/profileStorageRepository.ts');
  category='storage_lease';const storageOwner=load('src/infrastructure/storage/mmkvClient.ts'),storage=storageOwner.getKeyValueStorage(),lease=owner.captureActiveProfileStorageLease();
  if(!lease||!owner.isActiveProfileStorageLeaseCurrent(lease))throw Error('lease');
  const readEntries=()=>[...storage.getAllKeys()].sort().map(key=>[key,storage.getString(key)]);
  const readInventory=async()=>{const {packagePointerSources,...inventory}=await owner.inspectPreparedQ13StorageInventory(null);if(inventory.kind!=='observed'||!inventory.complete)throw Error('inventory');return inventory;};
  category='entries';const profile=owner.getActiveStorageProfileOrNull(),values=readEntries();category='inventory';const inventory=await readInventory();category='snapshot_fence';
  if(!owner.isActiveProfileStorageLeaseCurrent(lease)||JSON.stringify(values)!==JSON.stringify(readEntries()))throw Error('changed');
  const makeValue=(entries,inv)=>({values:entries,profile,inventory:inv,settings:settings.readSettings(),window:rn.Dimensions.get('window'),osAppearance:rn.Appearance.getColorScheme(),i18n:load('src/i18n.ts').default.language,bundleURL:rn.NativeModules.SourceCode?.getConstants?.().scriptURL??null});
  category="presentation";const reply={pending:false,value:makeValue(values,inventory)};
  if(allowRestore)reply.restore=async()=>{
   try {
    reply.pending=true;
    const freshInventory=await readInventory();
    if(!owner.isActiveProfileStorageLeaseCurrent(lease)||storageOwner.getKeyValueStorage()!==storage||JSON.stringify(profile)!==JSON.stringify(owner.getActiveStorageProfileOrNull())||JSON.stringify(values)!==JSON.stringify(readEntries())||JSON.stringify(inventory)!==JSON.stringify(freshInventory))throw Error('restore_fence');
    await settings.clearSettings();
    const after=await readInventory();if(!owner.isActiveProfileStorageLeaseCurrent(lease)||settings.readSettings()!==null)throw Error('restore_readback');
    reply.value=makeValue(readEntries(),after);reply.pending=false;delete reply.restore;
   }catch{reply.failed=true;reply.pending=false;delete reply.restore;}
  };
  host[symbol]=reply;
 }catch{host[symbol]={pending:false,failed:true,category};}
}
export async function main() {
 const [action='read',baselinePath]=process.argv.slice(2);
 if(!['read','restore-settings'].includes(action)||(action==='read'&&baselinePath)||(action==='restore-settings'&&!baselinePath))throw Error('ready_arguments');
 const before=action==='restore-settings'?JSON.parse(readFileSync(baselinePath,'utf8')):null;
 if(before&&(before.settings!==null||before.kind!=='startup-ready-preservation.v1'))throw Error('ready_original_settings_not_absent');
 const replyKey='patternly.startup-ready-private.'+randomUUID();let socket;let stage='connect';
 const expression=`void (${runtimeSnapshot.toString()})(${JSON.stringify(replyKey)},${action==='restore-settings'});true`;
 try {
  const origin=new URL('http://localhost:8083'),target=selectTarget(await(await fetch(new URL('/json/list',origin))).json(),origin,'com.lkurczab.patternly');
  const require=createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json',import.meta.url)),WS=require('ws');socket=new WS(target,{origin:'http://127.0.0.1:8083',handshakeTimeout:10000,maxPayload:16*1024*1024});await new Promise((ok,no)=>{socket.once('open',ok);socket.once('error',()=>no(Error('connection')));});let id=0;
  const evaluate=async expression=>{const r=await request(socket,++id,'Runtime.evaluate',{expression,returnByValue:true,silent:true});if(r.error||r.result?.exceptionDetails)throw Error('evaluation');return r.result.result.value;};
  stage='runtime_snapshot';await evaluate(expression);
  const readReply=async()=>{for(let attempt=0;attempt<100;attempt++){const reply=await evaluate(`(()=>{const r=globalThis[Symbol.for(${JSON.stringify(replyKey)})];return !r||r.pending?{pending:true}:r.failed?{failed:true,category:r.category}:{value:r.value};})()`);if(reply.failed){stage='runtime_'+(['runtime','modules','storage_lease','entries','inventory','snapshot_fence','presentation'].includes(reply.category)?reply.category:'restore');throw Error('sdk_inventory_or_lease');}if(reply.value)return reply.value;await new Promise(ok=>setTimeout(ok,100));}throw Error('sdk_timeout');};
  const project=value=>{const {values,profile,...presentation}=value;if(!Array.isArray(values)||values.some(row=>typeof row[0]!=='string'||typeof row[1]!=='string'))throw Error('record_type');return {kind:'startup-ready-preservation.v1',...presentation,inventorySemantics:'all registered-profile/global logical key-value inventory; not MMKV file bytes',allRecordInventorySha256:presentation.inventory.physicalInventorySha256,profileHash:hash(ordered(profile)),activeProfileIdHash:hash(profile.id),recordHashes:Object.fromEntries(values.map(([key,value])=>[key,hash(value)]))};};
  stage='sdk_inventory_read';let current=project(await readReply());
  if(before){
   stage='baseline_comparison';assertReadyRestorationBaseline(before,current);
   stage='lease_fenced_restore';await evaluate(`(()=>{const r=globalThis[Symbol.for(${JSON.stringify(replyKey)})];if(typeof r?.restore!=='function')throw Error('restore_unavailable');void r.restore();return true;})()`);
   stage='restored_inventory_readback';current=project(await readReply());assertReadyRestorationBaseline(before,current);
   if(current.settings!==null||ordered(before.recordHashes)!==ordered(current.recordHashes)||ordered(before.inventory)!==ordered(current.inventory))throw Error('restore_exact_inventory_failed');
   current.restoration={profileAndNonsettingsCheckedBeforeClear:true,leaseRecheckedBeforeClear:true,originalAbsenceReadBack:true,exactAllProfileInventoryRestored:true};
  }
  process.stdout.write(JSON.stringify(current,null,2)+'\n');
 }catch{process.stderr.write(`Ready preservation failed at ${stage}; no raw values were logged.\n`);process.exitCode=1;}
 finally{
  if(socket?.readyState===1){try{await request(socket,999,'Runtime.evaluate',{expression:`Reflect.deleteProperty(globalThis,Symbol.for(${JSON.stringify(replyKey)}))`,returnByValue:true,silent:true});}catch{}}
  socket?.terminate();
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
