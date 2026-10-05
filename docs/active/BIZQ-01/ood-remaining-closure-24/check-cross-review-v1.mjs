import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f)));
const raw=f=>sha256(fs.readFileSync(path.join(root,f)));
const manifest=read('N08-N09-MANIFEST.json');
const report=read('CROSS-UNIT-N24-CURRENT-v1.json');
const assert=(ok,label)=>{if(!ok)throw Error(label);};
assert(raw(report.inputs.manifestPath)===report.inputs.manifestSha256,'manifest raw binding');
assert(raw(report.inputs.contractPath)===report.inputs.contractSha256,'contract raw binding');
assert(raw(report.inputs.crossRegistryPath)===report.inputs.crossRegistrySha256,'registry raw binding');
assert(report.items.length===324&&report.unitProposalBindings.length===18,'closed size');
let verified=0;
for(const u of report.unitProposalBindings){
 assert(raw(u.proposalPath)===u.proposalSha256,'proposal raw binding '+u.unitId);
 const qs=read(u.proposalPath);assert(qs.length===18,'unit size');
 const before=manifest.units.find(x=>x.mentalUnitId===u.unitId);
 for(const item of report.items.filter(x=>x.unitId===u.unitId)){
  const old=before.beforeItems.find(x=>x.questionId===item.beforeQuestionId);
  const current=qs.find(x=>x.questionId===item.currentQuestionId);
  assert(sha256(canonicalJson(old.beforeQuestion))===item.beforeWholeQuestionSha256,'original whole binding');
  assert(sha256(canonicalJson(current))===item.currentWholeQuestionSha256,'current whole binding');
  assert(old.reservedNewQuestionId===item.reservedQuestionId,'reserved identity binding');
  verified++;
 }
}
const rows=report.items.filter(x=>x.unitId==='OOD-N08-B09').map(x=>({beforeQuestionId:x.beforeQuestionId,reviewedQuestionId:x.currentQuestionId,reservedQuestionId:x.reservedQuestionId,beforeWholeQuestionSha256:x.beforeWholeQuestionSha256,reviewedWholeQuestionSha256:x.currentWholeQuestionSha256,beforeAcceptedOptionText:x.beforeAcceptedOptionText,reviewedAcceptedOptionText:x.currentAcceptedOptionText,decision:'REPLACE_QUESTION_ID_AND_ALL_OPTION_IDS'}));
const result={scope:'Root exact binding and identity adjudication only; no semantic, source, admission or runtime acceptance',reportSha256:raw('CROSS-UNIT-N24-CURRENT-v1.json'),reportMarkdownSha256:raw('CROSS-UNIT-N24-CURRENT-v1.md'),manifestSha256:raw('N08-N09-MANIFEST.json'),contractSha256:raw('N08-N09-CONTRACT.json'),registrySha256:raw(report.inputs.crossRegistryPath),verifiedProposalFiles:18,verifiedOriginalAndCurrentPairs:verified,identityDecision:rows,rationale:'The original alternatives decide which owner enforces the invariant; the reviewed alternatives decide retry operation-ID scope. These are different learner choices despite a common idempotency topic. Use reserved IDs and fresh option identities for the final corrected proposal; counts are derived, not a quota.',invoiceOverlapDisposition:'Official cross review permits reinforcement: N02 known rejection versus N08 uncertain acceptance after lost ACK. Additional advisory disagreed, classifying functional duplication; root keeps the explicit uncertain-outcome reconciliation task as a distinct supported trigger. Advisory messages are not a saved report or a separate status queue.',remaining:'B09v5 full semantic review, B07 full diagnostics and legitimate-alternative fixes, B03i007 correction acceptance; then bounded cross refresh and producer proof review.'};
const output=process.argv[2];if(output)fs.writeFileSync(path.join(root,output),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({verifiedProposalFiles:18,verifiedOriginalAndCurrentPairs:verified,identityReplacements:rows.length,scope:result.scope}));
