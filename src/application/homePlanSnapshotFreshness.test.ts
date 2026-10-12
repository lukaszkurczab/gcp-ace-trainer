import assert from "node:assert/strict";
import test from "node:test";
import { HomePlanSnapshotReader } from "./homePlanSnapshotReader";
import { productionTrackAdmissionContext } from "./tracks/trackAdmissionContext";
import { readLearningPlanInputSnapshot } from "../storage/repositories/learningPlanInputSnapshot";
import { requireGoalPolicy } from "../domain/tracks/trackGoalPolicies";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../storage/keys";
import { writeCanonicalJson } from "../storage/repositories/canonicalRecordCodec";
import { installMemoryStorage, session } from "../testing/journalTestSupport";

const trackId = "coding-interview-dsa-problem-solving";
const request = { trackId, now: "2026-10-02T12:00:00.000Z" } as const;

test("empty Home input remains an explicit no-plan result", async () => {
  installMemoryStorage();
  assert.equal((await new HomePlanSnapshotReader().read(request)).kind, "none");
});

test("a storage cutover in the microtask between generations rejects even identical empty facts", async () => {
  installMemoryStorage();
  let reads = 0;
  const reader = new HomePlanSnapshotReader({
    readInputs: (track, policy) => {
      const snapshot = readLearningPlanInputSnapshot(track, policy, productionTrackAdmissionContext);
      if (++reads === 1) queueMicrotask(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
      return snapshot;
    },
    resolveExactArtifact: async () => { throw Error("empty Home must not resolve a package"); },
  });
  assert.deepEqual(await reader.read(request), { kind: "unavailable", trackId, reason: "concurrent_change" });
});

test("journal presence and a corrupt attempt index never become an empty Home", async () => {
  for (const corrupt of [false, true]) {
    const storage = installMemoryStorage();
    if (corrupt) storage.setString(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, "broken-json");
    else writeCanonicalJson(STORAGE_KEYS.ACTIVE_JOURNAL, { deliberatelyInvalidPendingJournal: true });
    assert.deepEqual(await new HomePlanSnapshotReader().read(request), { kind: "unavailable", trackId, reason: "storage_error" });
  }
});

test("the synchronous input owner rejects an indexed active session without its active pointer", async () => {
  installMemoryStorage();
  const active = session();
  writeCanonicalJson(STORAGE_KEYS.trainingSession(active.id), active);
  writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [active.id]);
  assert.throws(() => readLearningPlanInputSnapshot(trackId, requireGoalPolicy(trackId), productionTrackAdmissionContext));
  assert.deepEqual(await new HomePlanSnapshotReader().read(request), { kind: "unavailable", trackId, reason: "storage_error" });
});
