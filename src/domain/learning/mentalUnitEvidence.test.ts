import assert from "node:assert/strict";
import test from "node:test";
import { learningUnitIdentity, sameLearningUnit } from "./mentalUnitEvidence";
import type { ReviewEvidence } from "./reviewEvidence";
const evidence = (questionId="a", trackId="track"): ReviewEvidence => ({sourceItem:{trackId,questionId,contentVersion:"old",artifactSha256:"a".repeat(64)},taxonomyOrSkillRefs:[{axisId:"node",nodeId:"chapter",role:"primary"},{axisId:"mental_unit",nodeId:"u",role:"primary"}]});
test("unit identity comes only from unambiguous saved attribution and includes track and node",()=>{
  const a=evidence();
  assert.deepEqual(learningUnitIdentity(a),{nodeId:"chapter",mentalUnitId:"u"});
  assert.equal(sameLearningUnit(a,evidence("b")),true);
  assert.equal(sameLearningUnit(a,evidence("a","other")),false);
  for(const refs of [[],[{axisId:"node",nodeId:"chapter"}],[...a.taxonomyOrSkillRefs,{axisId:"mental_unit",nodeId:"v"}],[...a.taxonomyOrSkillRefs,{axisId:"node",nodeId:"other"}],[{axisId:"node",nodeId:"chapter"},{axisId:"skill",nodeId:"u"}],[{axisId:"node",nodeId:"chapter"},{axisId:"mental_unit",nodeId:"u",role:"secondary"}]]) {
    assert.equal(learningUnitIdentity({...a,taxonomyOrSkillRefs:refs}),undefined);
    assert.equal(sameLearningUnit(a,{...a,taxonomyOrSkillRefs:refs}),false);
  }
  assert.deepEqual(learningUnitIdentity({...a,taxonomyOrSkillRefs:[...a.taxonomyOrSkillRefs,...a.taxonomyOrSkillRefs]}),learningUnitIdentity(a));
});
