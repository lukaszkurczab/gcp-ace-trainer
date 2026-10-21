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

test("legacy attribution requires the exact source, absent unit refs and agreement of every node ref", async () => {
  const { createLegacyReviewUnitProof, learningUnitInCurrentCatalog, reviewEvidenceMatchesAttempt, isLegacyReviewUnitProof } = await import("./mentalUnitEvidence");
  const a = { ...evidence(), taxonomyOrSkillRefs: [] };
  const catalog = { trackId: "track", contentVersion: "old", artifactSha256: "a".repeat(64), getQuestion: (id: string) => id === "a" ? { trackId: "track", nodeId: "chapter", mentalUnitId: "u" } : undefined };
  const proof = createLegacyReviewUnitProof(a, catalog)!;
  assert.deepEqual(proof, { sourceItem: a.sourceItem, nodeId: "chapter", mentalUnitId: "u" });
  assert.ok(Object.isFrozen(proof) && Object.isFrozen(proof.sourceItem));
  assert.equal(reviewEvidenceMatchesAttempt(a, evidence("b"), proof, catalog), true);
  assert.equal(reviewEvidenceMatchesAttempt(a, evidence("b"), proof), true, "journal needs no catalog");
  assert.equal(reviewEvidenceMatchesAttempt(a, evidence("b")), false, "old sessions cannot infer a proof");
  for (const invalid of [
    { ...a, sourceItem: { ...a.sourceItem, trackId: "foreign" } },
    { ...a, sourceItem: { ...a.sourceItem, contentVersion: "foreign" } },
    { ...a, sourceItem: { ...a.sourceItem, artifactSha256: "b".repeat(64) } },
    { ...a, sourceItem: { ...a.sourceItem, questionId: "missing" } },
    { ...a, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: "foreign" }] },
    { ...a, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: "chapter" }, { axisId: "node", nodeId: "foreign", role: "secondary" }] },
    { ...a, taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: "u" }] },
    { ...a, taxonomyOrSkillRefs: [{ axisId: "mental_unit", nodeId: "", role: "secondary" }] },
  ]) {
    assert.equal(createLegacyReviewUnitProof(invalid, catalog), undefined);
    assert.equal(learningUnitInCurrentCatalog(invalid, catalog), undefined);
    assert.equal(reviewEvidenceMatchesAttempt(invalid, evidence("b"), proof, catalog), false);
  }
  for (const invalid of [null, undefined, { ...proof, extra: true }, { ...proof, nodeId: "" }, { ...proof, sourceItem: { ...proof.sourceItem, extra: true } }]) assert.equal(isLegacyReviewUnitProof(invalid), false);
  for (const invalid of [{ ...proof, nodeId: "other" }, { ...proof, mentalUnitId: "other" }, { ...proof, sourceItem: { ...proof.sourceItem, questionId: "missing" } }]) assert.equal(reviewEvidenceMatchesAttempt(a, evidence("b"), invalid, catalog), false);
  assert.equal(reviewEvidenceMatchesAttempt(a, evidence("b", "foreign"), proof, catalog), false);
  assert.equal(reviewEvidenceMatchesAttempt(a, { ...evidence("b"), sourceItem: { ...evidence("b").sourceItem, contentVersion: "new" } }, proof), false);
});
