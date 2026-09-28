import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateCanonicalArtifact } from "./questionValidation";
import type { CanonicalContentLockRecord } from "./questionTypes";

const root = path.resolve("src/content/generated/canonical-content");
const tracks = ["backend-system-design-interview", "frontend-system-design-interview", "object-oriented-design-interview"] as const;
const clone = <T>(value: T): T => structuredClone(value);

test("Design simulation profiles preserve exact per-track identity and reference-only evaluation", () => {
  for (const trackId of tracks) {
    const lock = (JSON.parse(readFileSync(path.join(root, "content-lock.json"), "utf8")) as { tracks: CanonicalContentLockRecord[] }).tracks.find((entry) => entry.trackId === trackId)!;
    const artifact = JSON.parse(readFileSync(path.join(root, `${trackId}.json`), "utf8")) as Record<string, unknown>;
    const profile = (artifact.simulationProfiles as Array<Record<string, unknown>>)[0]!;
    assert.equal(profile.profileId, `${trackId}-simulation-v1`);
    assert.equal(profile.modeId, "design-interview-simulation");
    const config = profile.familyConfig as Record<string, unknown>;
    assert.deepEqual((config.stages as Array<{ stageId: string }>).map((stage) => stage.stageId), ["requirements", "architecture", "tradeoffs", "final_answer"]);
    assert.deepEqual(config.outcomeEvaluation, { machineEvaluable: ["response_completeness"], semanticScoring: "not_evaluated" });
    assert.doesNotThrow(() => validateCanonicalArtifact(artifact, lock, trackId));
  }
});

test("Design simulation schema rejects identity, stage, response, criteria, rubric, and semantic-scoring drift", () => {
  const trackId = tracks[0];
  const lock = (JSON.parse(readFileSync(path.join(root, "content-lock.json"), "utf8")) as { tracks: CanonicalContentLockRecord[] }).tracks.find((entry) => entry.trackId === trackId)!;
  const source = JSON.parse(readFileSync(path.join(root, `${trackId}.json`), "utf8")) as Record<string, unknown>;
  const mutations: ((config: Record<string, unknown>, profile: Record<string, unknown>) => void)[] = [
    (_config, profile) => { profile.profileId = "frontend-system-design-interview-simulation-v1"; },
    (config) => { config.caseId = "../foreign"; },
    (config) => { (config.timer as Record<string, unknown>).durationSeconds = 2701; },
    (config) => { ((config.stages as Array<Record<string, unknown>>)[1]!).stageId = "tradeoffs"; },
    (config) => { (((config.stages as Array<Record<string, unknown>>)[0]!).response as Record<string, unknown>).required = false; },
    (config) => { ((config.reviewCriteria as Array<Record<string, unknown>>)[0]!).stageId = "architecture"; },
    (config) => { (config.rubric as Record<string, unknown>).kind = "scored"; },
    (config) => { (config.outcomeEvaluation as Record<string, unknown>).semanticScoring = "evaluated"; },
  ];
  for (const mutate of mutations) {
    const artifact = clone(source);
    const profile = (artifact.simulationProfiles as Array<Record<string, unknown>>)[0]!;
    mutate(profile.familyConfig as Record<string, unknown>, profile);
    assert.throws(() => validateCanonicalArtifact(artifact, lock, trackId));
  }
});
