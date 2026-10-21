import assert from "node:assert/strict";
import test from "node:test";
import { createContentSessionPlanFingerprint } from "./contentSessionIdentity";

const artifactA = "a".repeat(64);
const artifactB = "b".repeat(64);

const base = {
  trackId: "track-a",
  modeId: "mode-a",
  contentVersion: "content-v1",
  artifactSha256: artifactA,
  taxonomyVersion: "taxonomy-v1",
  configurationSnapshot: { kind: "practice" as const },
  itemOrder: [{ occurrenceId: "occurrence-1", item: { trackId: "track-a", questionId: "question-1", contentVersion: "content-v1", artifactSha256: artifactA } }],
  optionOrderByOccurrence: { "occurrence-1": ["option-a"] },
};

test("session fingerprint uses canonical artifact and occurrence identity", async () => {
  const original = await createContentSessionPlanFingerprint(base);
  const changedArtifact = await createContentSessionPlanFingerprint({
    ...base,
    artifactSha256: artifactB,
    itemOrder: [{ ...base.itemOrder[0]!, item: { ...base.itemOrder[0]!.item, artifactSha256: artifactB } }],
  });
  const changedQuestion = await createContentSessionPlanFingerprint({
    ...base,
    itemOrder: [{ ...base.itemOrder[0]!, item: { ...base.itemOrder[0]!.item, questionId: "question-2" } }],
  });

  assert.notEqual(original, changedArtifact);
  assert.notEqual(original, changedQuestion);
});

test("legacy unit proof is bound by the existing plan fingerprint and omission retains the old preimage", async () => {
  const snapshot = { source: "due_queue" as const, reviewEntryId: "review-a", sourceAttemptId: "attempt-a", dueAt: "2026-01-01T00:00:00.000Z", policyVersion: "legacy-unqualified", stage: "legacy_active_unqualified" as const };
  const old = { ...base, itemOrder: [{ ...base.itemOrder[0]!, reviewSourceSnapshot: snapshot }] };
  const proof = { sourceItem: { ...base.itemOrder[0]!.item, questionId: "source-a" }, nodeId: "node-u", mentalUnitId: "unit-u" };
  const session = { ...base, itemOrder: [{ ...base.itemOrder[0]!, reviewSourceSnapshot: { ...snapshot, legacyUnitProof: proof } }] };
  const original = await createContentSessionPlanFingerprint(session);
  assert.notEqual(original, await createContentSessionPlanFingerprint(old));
  for (const legacyUnitProof of [{ ...proof, nodeId: "other" }, { ...proof, mentalUnitId: "other" }, { ...proof, sourceItem: { ...proof.sourceItem, questionId: "other" } }]) {
    assert.notEqual(original, await createContentSessionPlanFingerprint({ ...session, itemOrder: [{ ...session.itemOrder[0]!, reviewSourceSnapshot: { ...snapshot, legacyUnitProof } }] }));
  }
  const { legacyUnitProof: _proof, ...omitted } = session.itemOrder[0]!.reviewSourceSnapshot;
  assert.equal(JSON.stringify(omitted), JSON.stringify(snapshot));
  assert.equal(await createContentSessionPlanFingerprint({ ...old, itemOrder: [{ ...old.itemOrder[0]!, reviewSourceSnapshot: omitted }] }), await createContentSessionPlanFingerprint(old));
});
