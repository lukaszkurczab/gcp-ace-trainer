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
