// Node CPU measurement of the actual Progress projection; no device/storage/UI claim.
// Run: node --import tsx scripts/qa/measureProgressProjection.ts
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { contentPackageRuntimeOwner } from "../../src/application/contentPackageRuntimeOwner";
import { createTrainingAttempt, type ReviewQueueEntry, type TrainingAttempt } from "../../src/domain";
import { buildProgressTabModel, type BuildProgressTabModelInput } from "../../src/features/home/tabs/progressTabModel";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
let stage = "package_admission";
async function main() {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const warmups = 3;
  const samples = 15;
  const results = [];
  for (const trackId of ["coding-interview-dsa-problem-solving", "frontend-system-design-interview"]) {
    const track = contentPackageRuntimeOwner.getPreparedDiscovery(trackId).track;
    for (const count of [100, 1000, 10000]) for (const reviewCount of [0, 100, 1000]) {
      stage = "synthetic_fixture";
      const attempts: TrainingAttempt[] = Array.from({ length: count }, (_, i) => {
        const question = track.questions[(i * 31) % track.questions.length]!;
        const item = { trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questionId: question.questionId };
        const at = new Date(Date.UTC(2026, 0, 1, 0, Math.floor(i / 3))).toISOString();
        const kind = i % 3 === 0 ? "correct" : i % 3 === 1 ? "partial" : "incorrect";
        return createTrainingAttempt({ id: `perf02-attempt:${String(i).padStart(5, "0")}`, sessionId: "perf02-session", trackId: trackId as TrainingAttempt["trackId"], modeId: "practice", occurrenceId: `perf02-occurrence:${i}`, item, response: {}, result: { kind, earnedPoints: kind === "correct" ? 1 : kind === "partial" ? 0.5 : 0, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt: at, committedAt: at });
      }).reverse();
      const reviews: ReviewQueueEntry[] = Array.from({ length: reviewCount }, (_, i) => ({
        id: `perf02-review:${i}`, trackId: trackId as ReviewQueueEntry["trackId"], sourceAttemptId: `perf02-source:${i}`, sourceSessionId: "perf02-session",
        sourceItem: { trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questionId: track.questions[i % track.questions.length]!.questionId }, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], createdAt: "2026-01-01T00:00:00.000Z", dueAt: i % 2 ? "2026-02-01T00:00:00.000Z" : "2026-01-01T00:00:00.000Z", persistent: false, consecutiveAfterDueSuccesses: 0, policyVersion: "bizq04-v1", stage: "retention7", status: "active",
      }));
      const input: BuildProgressTabModelInput = { activeTrackId: track.trackId, analytics: {} as never, attempts: [], activityRecords: [], practiceHistory: [], trainingAttempts: attempts, reviewQueueItems: reviews, now: "2026-01-15T00:00:00.000Z", timezone: "UTC" };
      const inputSha256 = hash(input);
      stage = "projection_measurement";
      for (let i = 0; i < warmups; i++) buildProgressTabModel(input);
      const elapsedMs: number[] = [];
      let outputSha256: string | undefined;
      for (let i = 0; i < samples; i++) {
        const start = performance.now();
        const output = buildProgressTabModel(input);
        elapsedMs.push(performance.now() - start);
        const digest = hash(output);
        if (outputSha256 && digest !== outputSha256) throw Error("progress_measurement_output_changed");
        outputSha256 = digest;
      }
      if (hash(input) !== inputSha256) throw Error("progress_measurement_input_changed");
      const sorted = [...elapsedMs].sort((a, b) => a - b);
      results.push({ trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questions: track.questions.length, attempts: count, reviews: reviewCount, inputSha256, outputSha256, medianMs: sorted[7], p95Ms: sorted[14], elapsedMs });
    }
  }
  stage = "receipt";
  console.log(JSON.stringify({ schema: "patternly.progress-projection-measurement.v1", runtime: process.version, sourceSha256: hash(readFileSync("src/features/home/tabs/progressTabModel.ts", "utf8")), warmups, samples, results }, null, 2));

}
main().catch(() => { console.error(`progress_measurement_failed:${stage}`); process.exitCode = 1; });
