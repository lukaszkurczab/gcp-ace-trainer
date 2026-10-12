// Derived category comparison only; raw receipts stay private. Does not alter device data.
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
try {
const [root,...extra]=process.argv.slice(2);
if(!root||extra.length)throw Error('arguments_rejected');
const before=JSON.parse(readFileSync(join(resolve(root),'before.json')));
const after=JSON.parse(readFileSync(join(resolve(root),'after.json')));
const categories=['learningProgress','settings','profileLifecycle','packagePointers','premiumCache','premiumTestRuntime'];
for(const snapshot of[before,after]){
 if(snapshot.schemaVersion!==1||snapshot.stage!=='native_guest_export_readback'
  ||snapshot.inventory?.control?.kind!=='observed'||snapshot.inventory?.secureControl?.kind!=='observed'
  ||snapshot.inventory.profileCount!==snapshot.registry?.profileCount
  ||snapshot.inventory.profileInventories?.length!==snapshot.registry.profileCount)throw Error('receipt_invalid');
 const profiles=snapshot.inventory.profileInventories;
 if(new Set(profiles.map(p=>p.profileIdSha256)).size!==profiles.length)throw Error('receipt_invalid');
 for(const profile of profiles){
  if(!/^[a-f0-9]{64}$/.test(profile.profileIdSha256)||!['account','guest'].includes(profile.kind)
   ||profile.categoryInventories?.length!==categories.length
   ||new Set(profile.categoryInventories.map(c=>c.category)).size!==categories.length
   ||profile.categoryInventories.some(c=>!categories.includes(c.category)||!Number.isInteger(c.keyCount)||c.keyCount<0||!/^[a-f0-9]{64}$/.test(c.inventorySha256)))throw Error('receipt_invalid');
 }
 if(profiles.filter(p=>p.kind==='guest').length!==1
  ||!profiles.some(p=>p.kind==='guest'&&p.profileIdSha256===snapshot.registry.selectedProfileIdSha256)
  ||snapshot.inventory.globalInventories?.length!==2
  ||new Set(snapshot.inventory.globalInventories.map(c=>c.category)).size!==2
  ||snapshot.inventory.globalInventories.some(c=>!['premium_cache','premium_test_runtime'].includes(c.category)))throw Error('receipt_invalid');
}
const original=before.inventory.profileInventories;
const current=after.inventory.profileInventories;
const changes=[];
let missing=0;
for(const old of original){
 const now=current.find(p=>p.profileIdSha256===old.profileIdSha256);
 if(!now||now.kind!==old.kind){missing++;continue;}
 for(const category of old.categoryInventories){
  const next=now.categoryInventories.find(c=>c.category===category.category);
  if(!isDeepStrictEqual(category,next))changes.push({kind:old.kind,category:category.category});
 }
}
const added=current.filter(p=>!original.some(o=>o.profileIdSha256===p.profileIdSha256));
const identityPreserved=before.registry.selectedProfileIdSha256===after.registry.selectedProfileIdSha256;
const canonicalGuestEqual=isDeepStrictEqual(before.canonicalExportInputs,after.canonicalExportInputs);
const globalChanges=before.inventory.globalInventories.filter(old=>!isDeepStrictEqual(old,after.inventory.globalInventories.find(n=>n.category===old.category))).map(p=>p.category);
const expectedShape=before.registry.profileCount===12&&before.registry.guestCount===1&&after.registry.profileCount===13&&after.registry.guestCount===1&&added.length===1&&added[0].kind==='account';
const result={schema:'patternly.ch07-preservation.v1',expectedShape,identityPreserved,canonicalGuestEqual,originalProfiles:original.length,missingOriginalProfiles:missing,originalCategoryChanges:changes,addedAccountProfiles:added.filter(p=>p.kind==='account').length,globalChanges,controlChanged:!isDeepStrictEqual(before.inventory.control,after.inventory.control),secureControlChanged:!isDeepStrictEqual(before.inventory.secureControl,after.inventory.secureControl)};
console.log(JSON.stringify(result,null,2));
// Lifecycle/cache changes require an owner-based receipt, not an automatic PASS.
if(!expectedShape||!identityPreserved||!canonicalGuestEqual||missing||changes.length||globalChanges.length||result.secureControlChanged)process.exitCode=1;

} catch { console.error(JSON.stringify({stage:"ch07_preservation",category:"receipt_read_rejected"})); process.exitCode=1; }
