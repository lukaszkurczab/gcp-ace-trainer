// Synthetic persisted canonical fixtures; measures real recovery/codecs, not native durability.
// node --import tsx scripts/qa/measureMutationRecovery.ts [samples=7] [maxAttempts=10000]
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createTrainingAttempt, createTrainingSession, type ReviewQueueEntry } from "../../src/domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../src/infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../../src/storage/keys";
import { writeCanonicalJson } from "../../src/storage/repositories/canonicalRecordCodec";
import { assertTrainingEvidenceIntegrity } from "../../src/storage/repositories/trainingEvidenceIntegrityRepository";
import { getActiveMutationJournal, persistMutationJournal } from "../../src/storage/repositories/mutationJournalRepository";
import { productionLearningDataAdmissionContext, productionTrackAdmissionContext } from "../../src/application/tracks/trackAdmissionContext";
import { buildMutationJournal } from "../../src/application/learningMutations/mutationJournalBuilder";
import { recoverPendingMutation } from "../../src/application/learningMutations/recoverPendingMutation";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const trackId = "coding-interview-dsa-problem-solving";
const at = "2026-10-12T12:00:00.000Z";
const item = { trackId, questionId: "synthetic-question", contentVersion: "synthetic-v1", artifactSha256: "a".repeat(64) };
class CountedStorage extends MemoryKeyValueStorage {
  readCount = 0; readCharacters = 0; writeCount = 0; removeCount = 0; enumerationCount = 0;
  override getString(key: string) { const value = super.getString(key); this.readCount++; this.readCharacters += value?.length ?? 0; return value; }
  override setString(key: string, value: string) { this.writeCount++; super.setString(key, value); }
  override remove(key: string) { this.removeCount++; super.remove(key); }
  override getAllKeys() { this.enumerationCount++; return super.getAllKeys(); }
  entries() { return [...super.getAllKeys()].sort().map(key => [key, super.getString(key)!] as const); }
  resetCounts() { this.readCount = this.readCharacters = this.writeCount = this.removeCount = this.enumerationCount = 0; }
}
const makeAttempt = (id: string, sessionId: string, occurrenceId: string) => createTrainingAttempt({ id, sessionId, occurrenceId, trackId, modeId: "synthetic-mode", item: { ...item, questionId: `synthetic-question:${occurrenceId}` }, response: {}, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 }, reviewEvidence: { sourceItem: { ...item, questionId: `synthetic-question:${occurrenceId}` }, taxonomyOrSkillRefs: [] }, answeredAt: at, committedAt: at });
const makeSession = (id: string, occurrences: readonly string[], completed: boolean) => createTrainingSession({ id, trackId, modeId: "synthetic-mode", configurationSnapshot: { kind: "practice" }, requestedLength: occurrences.length, actualLength: occurrences.length, currentItemIndex: completed ? occurrences.length - 1 : 0, itemOrder: occurrences.map(occurrenceId => ({ occurrenceId, item: { ...item, questionId: `synthetic-question:${occurrenceId}` } })), optionOrderByOccurrence: {}, activeForegroundMs: completed ? 10000 : 0, contentVersion: item.contentVersion, artifactSha256: item.artifactSha256, status: completed ? "completed" : "active", startedAt: at, ...(completed ? { completedAt: at } : {}) });
let stage = "arguments";
async function main() {
  const samples = Number(process.argv[2] ?? 7), maxAttempts = Number(process.argv[3] ?? 10000);
  assert.ok(Number.isInteger(samples) && samples >= 1 && samples <= 25);
  assert.ok([100, 1000, 10000].includes(maxAttempts));
  const results = [];
  for (const count of [100, 1000, 10000].filter(n => n <= maxAttempts)) {
    stage = "canonical_fixture";
    const storage = new CountedStorage(); installKeyValueStorageForTests(storage);
    const attempts = Array.from({ length: count }, (_, i) => makeAttempt(`history-a:${i}`, `history-s:${Math.floor(i / 10)}`, `history-o:${i}`));
    const sessions = Array.from({ length: count / 10 }, (_, i) => makeSession(`history-s:${i}`, attempts.slice(i * 10, i * 10 + 10).map(a => a.occurrenceId), true));
    const reviews: ReviewQueueEntry[] = attempts.slice(0, count / 10).map((a, i) => ({ id: `history-r:${i}`, trackId, sourceAttemptId: a.id, sourceSessionId: a.sessionId, sourceItem: a.item, taxonomyOrSkillRefs: [], reasons: ["incorrect"], dueAt: at, createdAt: at, consecutiveAfterDueSuccesses: 0, persistent: true }));
    for (const a of attempts) writeCanonicalJson(STORAGE_KEYS.trainingAttempt(a.id), a);
    for (const s of sessions) writeCanonicalJson(STORAGE_KEYS.trainingSession(s.id), s);
    for (const r of reviews) writeCanonicalJson(STORAGE_KEYS.reviewEntry(r.id), r);
    const targetSession = makeSession("target-session", ["target-occurrence"], false);
    writeCanonicalJson(STORAGE_KEYS.trainingSession(targetSession.id), targetSession);
    writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [...sessions.map(s => s.id), targetSession.id]);
    writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, attempts.map(a => a.id));
    writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, reviews.map(r => r.id));
    assertTrainingEvidenceIntegrity(productionTrackAdmissionContext);
    stage = "durable_journal";
    const targetAttempt = makeAttempt("target-attempt", targetSession.id, "target-occurrence");
    const record = await buildMutationJournal({ operation: "submit_training_outcome", sessionId: targetSession.id, trackId, identity: targetAttempt.response, writes: [{ kind: "put_attempt", record: targetAttempt }, { kind: "put_session", record: { ...targetSession, activeForegroundMs: 1000 } }], createdAt: at });
    await persistMutationJournal(record, productionLearningDataAdmissionContext);
    assert.equal(getActiveMutationJournal(productionLearningDataAdmissionContext)?.status, "journal_durable");
    const input = storage.entries(), inputSha256 = hash(input);
    const measurements = []; let outputSha256: string | undefined;
    stage = "materialize_verify_clear";
    for (let i = -1; i < samples; i++) {
      const run = new CountedStorage(); for (const [key, value] of input) run.setString(key, value);
      installKeyValueStorageForTests(run); run.resetCounts();
      const start = performance.now(); await recoverPendingMutation(); const elapsedMs = performance.now() - start;
      const measured = { elapsedMs, reads: run.readCount, readCharacters: run.readCharacters, writes: run.writeCount, removals: run.removeCount, enumerations: run.enumerationCount };
      assert.equal(getActiveMutationJournal(productionLearningDataAdmissionContext), null);
      assertTrainingEvidenceIntegrity(productionTrackAdmissionContext);
      const digest = hash(run.entries()); if (outputSha256) assert.equal(digest, outputSha256); outputSha256 = digest;
      const recovered = run.entries(); await recoverPendingMutation(); assert.deepEqual(run.entries(), recovered);
      if (i >= 0) measurements.push(measured);
    }
    const sorted = measurements.map(m => m.elapsedMs).sort((a, b) => a - b);
    results.push({ attempts: count, sessions: sessions.length + 1, reviews: reviews.length, inputSha256, outputSha256, medianMs: sorted[Math.floor(samples / 2)], p95Ms: sorted[Math.ceil(samples * 0.95) - 1], measurements });
  }
  console.log(JSON.stringify({ schema: "patternly.mutation-recovery-measurement.v1", runtime: process.version, envelope: "synthetic canonical memory storage; no native MMKV/UI claim", verifierSha256: hash(readFileSync("src/application/learningMutations/mutationVerifier.ts", "utf8")), integritySha256: hash(readFileSync("src/storage/repositories/trainingEvidenceIntegrityRepository.ts", "utf8")), warmups: 1, samples, results }, null, 2));
}
main().catch(error => {
  const categories: string[] = [];
  for (let cause: unknown = error; cause instanceof Error; cause = cause.cause) categories.push(cause.name + ("phase" in cause ? `/${String(cause.phase)}` : ""));
  console.error(`mutation_recovery_measurement_failed:${stage}:${categories.join("→") || "unknown"}`); process.exitCode = 1;
});
