import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=dirname(fileURLToPath(import.meta.url));const workspace=resolve(packet,'../../../../..');
const get=p=>JSON.parse(readFileSync(p,'utf8'));const report=resolve(packet,'CROSS-UNIT-N07-B01-B05-v1.json');const qa=get(report);assert.equal(qa.verdict,'PASS_WITH_ADVISORY');
let bindings=0;const bind=(p,sha,base=packet)=>{assert.equal(sha256(readFileSync(resolve(base,p))),sha,p);bindings++;};
for(const prefix of ['spec','contract','brief','guidelines'])bind(qa.criteria[prefix+'Path'],qa.criteria[prefix+'Sha256'],workspace);
const objects=[];for(const u of qa.reviewedUnits){for(const prefix of ['proposal','semanticReport','acceptanceReceipt'])bind(u[prefix+'Path'],u[prefix+'Sha256']);objects.push(...get(resolve(packet,u.proposalPath)));}
assert.equal(objects.length,90);assert.equal(qa.reviewedWholeObjects.length,90);
for(const q of objects){const row=qa.reviewedWholeObjects.find(x=>x.questionId===q.questionId);assert.ok(row);assert.equal(sha256(canonicalJson(q)),row.wholeObjectSha256);assert.equal(q.answer.optionId,row.acceptedOptionId);assert.equal(q.interaction.options.find(x=>x.optionId===q.answer.optionId).text,row.acceptedOptionText);}
const c=qa.acceptedControl;bind(c.n01n05.baselinePath,c.n01n05.baselineSha256,workspace);bind(c.n06.semanticAcceptancePath,c.n06.semanticAcceptanceSha256,workspace);
let controls=0;for(const s of c.n01n05.sourceFiles){bind(s.path,s.sha256,workspace);controls+=get(resolve(workspace,s.path)).length;}
for(const s of c.n06.unitFiles){bind(s.sourcePath,s.sourceFileSha256,workspace);bind(s.acceptedProposalPath,s.acceptedProposalSha256,resolve(packet,'../ood-remaining-closure-22'));const actual=get(resolve(workspace,s.sourcePath));const accepted=get(resolve(packet,'../ood-remaining-closure-22',s.acceptedProposalPath));assert.equal(canonicalJson(actual),canonicalJson(accepted));controls+=actual.length;}
assert.equal(controls,945);assert.equal(c.totalQuestions,945);
const receipt={result:'PASS_WITH_ADVISORY',scope:'Root exact partial90 review/input/control bindings only; final144 semantic/source/producer/admission pending',qaJsonSha256:sha256(readFileSync(report)),wholeProposalObjectsMatched:90,acceptedControlSourceObjects:controls,rawBindingsMatched:bindings,nonBlockingWarning:'N07B05i012 provenance reinforcement documented; no unique-concept quota',packageAcceptance:false,sourceActivation:false};
writeFileSync(resolve(packet,'ROOT-N07-PARTIAL-CROSS-UNIT-ACCEPTANCE.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
