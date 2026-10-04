// Actual changed-source and untouched-boundary comparison against frozen N06 baseline.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {canonicalJson,sha256,validateTrack} from '../../../../../patternly-content/scripts/build.mjs';
const packet=new URL('./',import.meta.url),content=new URL('../../../../../patternly-content/',packet),app=new URL('../../../../',packet);
const baseline=JSON.parse(await readFile(new URL('ROOT-N06-BASELINE.json',packet)));
const proof=JSON.parse(await readFile(new URL('PREPARED-FIXED-PROOF22.json',packet)));
const track=await validateTrack({rootDirectory:fileURLToPath(content),trackId:proof.trackId});assert.equal(track.track.contentVersion,proof.contentVersion);assert.equal(sha256(canonicalJson(track.questions)),proof.questionSetSha256);assert.equal(track.questions.length,1413);
const byId=new Map(track.questions.map(q=>[q.questionId,q]));
for(const item of proof.sameIdCorrections)assert.deepEqual(byId.get(item.questionId),item.currentQuestion);
for(const q of baseline.preservedQuestions)assert.equal(sha256(canonicalJson(byId.get(q.questionId))),q.wholeQuestionSha256);
const accepted=track.questions.filter(q=>/^OOD-N0[1-5]-/.test(q.mentalUnitId));assert.equal(accepted.length,765);assert.equal(sha256(canonicalJson(accepted)),baseline.acceptedN01N05QuestionSetSha256);
for(const [file,binding] of Object.entries(baseline.untouchedContentFiles))assert.equal(sha256(await readFile(new URL(file,content))),binding.sha256,file);
for(const [file,binding] of Object.entries(baseline.immutableBusinessQualityProofs))assert.equal(sha256(await readFile(new URL(file,content))),binding.sha256,file);
for(const [file,binding] of Object.entries(baseline.otherArtifacts))assert.equal(sha256(await readFile(new URL('src/content/generated/canonical-content/'+file,app))),binding.sha256,file);
console.log(JSON.stringify({result:'PASS',scope:'Actual source22 contract/current180/wholeQset and unchanged1233OOD/765accepted/943other content/13oldproofs/8artifact bytes; no producer/consumer/admission acceptance',wholeQuestions:1413,changedQuestions:180,preservedOOD:baseline.preservedQuestions.length,acceptedN01N05:accepted.length,untouchedContentFiles:Object.keys(baseline.untouchedContentFiles).length,immutableProofFiles:Object.keys(baseline.immutableBusinessQualityProofs).length,otherArtifacts:Object.keys(baseline.otherArtifacts).length,questionSetSha256:proof.questionSetSha256}));
