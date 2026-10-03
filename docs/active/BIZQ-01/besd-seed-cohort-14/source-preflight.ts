import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import path from "node:path";
import {loadCanonicalRuntimeCatalog} from "../../../../src/content/canonical/runtimeCatalog";
import {toCanonicalQuestionViewModel} from "../../../../src/features/practice/canonicalQuestionViewModel";
import type {Question} from "../../../../src/content/canonical/questionTypes";
const packet=path.resolve("docs/active/BIZQ-01/besd-seed-cohort-14");
const baseline=JSON.parse(readFileSync(path.join(packet,"PREFLIGHT.json"),"utf8")) as {units:{sourceFile:string;preservedQuestionId:string;preservedQuestion:Question;replacements:{beforeQuestionId:string;proposedQuestionId:string;beforeQuestion:Question}[]}[]};
async function main(){
 const track=(await loadCanonicalRuntimeCatalog()).getTrack("backend-system-design-interview");
 const pools=track.modes.map(mode=>({modeId:mode.modeId,pool:track.getPool(mode.modeId)}));
 const reproduced=[];
 for(const unit of baseline.units){
  const source=JSON.parse(readFileSync(path.resolve("../patternly-content",unit.sourceFile),"utf8")) as Question[];
  assert.deepEqual(source.find(q=>q.questionId===unit.preservedQuestionId),unit.preservedQuestion);
  assert.deepEqual(track.getQuestion(unit.preservedQuestionId),unit.preservedQuestion);
  for(const entry of unit.replacements){
   const q=track.getQuestion(entry.beforeQuestionId);assert.ok(q);
   assert.deepEqual(q,entry.beforeQuestion);assert.deepEqual(q,source.find(x=>x.questionId===entry.beforeQuestionId));
   assert.equal(track.getQuestion(entry.proposedQuestionId),undefined,"proposed identity unused in actual runtime catalog");
   const vm=toCanonicalQuestionViewModel(q);assert.deepEqual(vm.constraints,q.constraints);
   assert.ok(vm.constraints.some(text=>text.includes("The primary decision is")),"actual pre-answer view model exposes author primary-decision instruction");
   reproduced.push({questionId:q.questionId,sourceAndAppExact:true,preAnswerViewModelDisclosure:true,poolReachability:pools.map(({modeId,pool})=>({modeId,eligible:pool.some(item=>item.questionId===q.questionId)}))});
  }
 }
 assert.equal(reproduced.length,32);
 console.log(JSON.stringify({evidence:"actual bundled catalog and pre-answer question view model; read-only, no session/storage/device/service actions",reproduced:32,pools:pools.map(({modeId,pool})=>({modeId,count:pool.length})),items:reproduced,boundaries:["source/render-props wiring, not installed native screenshot","current mode reachability observed separately from source defect","no manually widened session or Premium bypass"]},null,2));
}
void main();
