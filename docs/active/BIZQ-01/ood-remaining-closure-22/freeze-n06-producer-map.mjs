// Exact accepted semantic inputs prepared for producer design; no canonical writes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {canonicalJson,sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url), content=new URL('../../../../../patternly-content/',packet);
const read=async name=>readFile(new URL(name,packet));
const reportBytes=await read('SEMANTIC-CURRENT-ACCEPTED-QA.json');
assert.equal(sha256(reportBytes),'3ddac680b864069af4295ac5c2f90d8a83564431b996188b85bdc49effe84ff8');
const report=JSON.parse(reportBytes);assert.equal(report.verdict,'PASS');
const registryBytes=await read(report.registry.path);assert.equal(sha256(registryBytes),report.registry.sha256);
const registry=JSON.parse(registryBytes),manifestBytes=await read('N06-MANIFEST.json'),manifest=JSON.parse(manifestBytes);
assert.equal(sha256(manifestBytes),registry.manifestSha256);
for(const binding of [report.criteria,report.bindingReceipt]){const path=binding.contractPath??binding.path;const hash=binding.contractSha256??binding.sha256;assert.equal(sha256(await read(path)),hash);}
assert.equal(sha256(await read(report.criteria.specPath)),report.criteria.specSha256);
for(const u of report.unitReviews){assert.equal(sha256(await read(u.proposalPath)),u.proposalSha256);assert.equal(u.verdict,'PASS');if(u.reviewReportSha256)assert.equal(sha256(await read(u.reviewReport)),u.reviewReportSha256);}
const sourceFiles=[],sameIdCorrections=[];
for(const unit of registry.units){
 const bytes=await read(unit.proposalPath);assert.equal(sha256(bytes),unit.proposalSha256);
 const notesBytes=await read(unit.notesPath);assert.equal(sha256(notesBytes),unit.notesSha256);
 const questions=JSON.parse(bytes).sort((a,b)=>a.questionId.localeCompare(b.questionId));
 const notes=JSON.parse(notesBytes).items;const old=manifest.units.find(u=>u.mentalUnitId===unit.mentalUnitId);assert(old);
 const raw=await readFile(new URL(old.sourcePath,content));assert.equal(sha256(raw),old.sourceSha256);
 const beforeObjects=old.beforeItems.map(i=>i.beforeQuestion).sort((a,b)=>a.questionId.localeCompare(b.questionId));assert.equal(sha256(JSON.stringify(beforeObjects)),old.sourceSha256);
 const source={sourceFile:old.sourcePath,beforeSourceSha256:old.sourceSha256,sourceSha256:sha256(JSON.stringify(questions)),nodeId:questions[0].nodeId,mentalUnitId:unit.mentalUnitId};sourceFiles.push(source);
 assert.equal(questions.length,18);
 for(const question of questions){
  const before=old.beforeItems.find(i=>i.questionId===question.questionId),note=notes.find(i=>i.questionId===question.questionId),binding=registry.items.find(i=>i.questionId===question.questionId);
  assert(before&&note&&binding);assert.equal(note.identityAction,'preserve_question_id');assert.equal(note.beforeQuestionId,question.questionId);
  assert.equal(sha256(canonicalJson(question)),binding.currentWholeQuestionSha256);assert.equal(sha256(canonicalJson(before.beforeQuestion)),binding.beforeWholeQuestionSha256);
  assert.equal(question.answer.optionId,binding.acceptedOptionId);assert.deepEqual(note.sourceRefs,question.sourceRefs);
  sameIdCorrections.push({...source,beforeQuestionId:question.questionId,questionId:question.questionId,nodeId:question.nodeId,mentalUnitId:question.mentalUnitId,
   learningObjective:note.learningObjective,confirmedDefects:before.findingCodes,identityAction:note.identityAction,identityReason:note.identityReason,acceptedOptionId:question.answer.optionId,sourceRefs:question.sourceRefs,beforeQuestion:before.beforeQuestion,currentQuestion:question});
 }
}
assert.equal(sameIdCorrections.length,180);assert.equal(sourceFiles.length,10);
const proof={schemaVersion:'patternly-bizq-semantic-replacement-v1',scope:'BIZQ-01 OOD source22, fixed ten-unit N06 cohort; 180 same-ID corrections and zero question replacements; not full-bank acceptance',trackId:manifest.trackId,beforeProducerCommit:manifest.producerRepositoryHead,beforeContentVersion:manifest.contentVersion,contentVersion:'object-oriented-design-interview-authoring-v2026.10.04-bizq01-22',beforeQuestionSetSha256:registry.beforeQuestionSetSha256,questionSetSha256:registry.prospectiveQuestionSetSha256,sourceFiles,replacements:[],sameIdCorrections};
const proofBytes=Buffer.from(JSON.stringify(proof,null,2)+'\n');
await writeFile(new URL('PREPARED-FIXED-PROOF22.json',packet),proofBytes,{flag:'wx'});
const map={result:'PASS',scope:'Accepted exact semantic map prepared for independent producer design; no canonical activation/admission acceptance',registrySha256:sha256(registryBytes),semanticReportSha256:sha256(reportBytes),proofSha256:sha256(proofBytes),...proof};
await writeFile(new URL('ROOT-N06-PRODUCER-MAP.json',packet),JSON.stringify(map,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:'PASS',sourceFiles:10,sameIdCorrections:180,replacements:0,proofSha256:sha256(proofBytes),questionSetSha256:proof.questionSetSha256,beforeProducerCommit:proof.beforeProducerCommit}));
