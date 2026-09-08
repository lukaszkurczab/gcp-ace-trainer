import assert from "node:assert/strict";
import test from "node:test";
import { createContentPackagePin, createPackageCompletionRuleV1, evaluatePackageCompletion, type TrainingAttempt } from "..";

const pin = createContentPackagePin({ packageIdentity: "a".repeat(64), packageVersion: "1.0.0", contentReleaseId: "release" });
const profile = Object.freeze({ trackId: "track", contentVersion: "content-v1", packagePin: pin, completionRule: createPackageCompletionRuleV1({ ruleVersion: 1, minimumAttemptCount: 3, rollingWindowSize: 2, qualityThreshold: 0.5 }) });

function attempt(id: string, answeredAt: string, kind: "correct" | "partial" | "incorrect" = "correct", overrides: Partial<TrainingAttempt<unknown>> = {}): TrainingAttempt<unknown> {
  const result = kind === "correct" ? { kind, earnedPoints: 1, maxPoints: 1 } : kind === "partial" ? { kind, earnedPoints: 0.5, maxPoints: 1 } : { kind, earnedPoints: 0, maxPoints: 1 };
  return { id, sessionId: `session-${id}`, occurrenceId: `occurrence-${id}`, trackId: "track", modeId: "mode", item: { trackId: "track", itemId: "same-item-is-allowed", contentVersion: "content-v1", packagePin: pin }, response: {}, result, reviewEvidence: { sourceItem: { trackId: "track", itemId: "same-item-is-allowed", contentVersion: "content-v1", packagePin: pin }, taxonomyOrSkillRefs: [] }, answeredAt, committedAt: answeredAt, ...overrides } as TrainingAttempt<unknown>;
}

test("completion rule validates explicit v1 bounds", () => {
  for (const rule of [{ ruleVersion: 1, minimumAttemptCount: 0, rollingWindowSize: 1, qualityThreshold: 0.5 }, { ruleVersion: 1, minimumAttemptCount: 1, rollingWindowSize: 2, qualityThreshold: 0.5 }, { ruleVersion: 1, minimumAttemptCount: 2, rollingWindowSize: 1, qualityThreshold: 1.1 }, { ruleVersion: 2, minimumAttemptCount: 2, rollingWindowSize: 1, qualityThreshold: 0.5 }]) assert.throws(() => createPackageCompletionRuleV1(rule));
  assert.throws(() => createPackageCompletionRuleV1({ ruleVersion: 1, minimumAttemptCount: 2, rollingWindowSize: 1, qualityThreshold: 0.5, extra: true }));
  assert.equal(createPackageCompletionRuleV1({ ruleVersion: 1, minimumAttemptCount: 2, rollingWindowSize: 1, qualityThreshold: 0 }).qualityThreshold, 0);
  assert.equal(createPackageCompletionRuleV1({ ruleVersion: 1, minimumAttemptCount: 2, rollingWindowSize: 1, qualityThreshold: 1 }).qualityThreshold, 1);
});

test("completion is unknown without a package rule and otherwise uses the exact rolling window", () => {
  assert.deepEqual(evaluatePackageCompletion({ ...profile, completionRule: undefined }, []), { kind: "unknown" });
  const attempts = [attempt("three", "2026-01-03T00:00:00.000Z", "correct"), attempt("one", "2026-01-01T00:00:00.000Z", "incorrect"), attempt("two", "2026-01-02T00:00:00.000Z", "correct")];
  assert.deepEqual(evaluatePackageCompletion(profile, attempts), { kind: "completed", qualifyingAttemptCount: 3, rollingWindowSize: 2, quality: 1 });
});

test("completion filters full package identity, deduplicates exact retries, and rejects malformed or conflicting durable evidence", () => {
  const valid = attempt("same", "2026-01-01T00:00:00.000Z");
  const foreignItem = { ...valid.item, contentVersion: "other" };
  const foreign = attempt("foreign", "2026-01-02T00:00:00.000Z", "correct", { item: foreignItem, reviewEvidence: { ...valid.reviewEvidence, sourceItem: foreignItem } });
  assert.equal(evaluatePackageCompletion(profile, [valid, valid, foreign]).kind, "in_progress");
  assert.throws(() => evaluatePackageCompletion(profile, [valid, { ...valid, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 } }]), /Conflicting/);
  assert.throws(() => evaluatePackageCompletion(profile, [valid, { ...foreign, id: valid.id }]), /Conflicting/);
  assert.throws(() => evaluatePackageCompletion(profile, [attempt("bad-time", "not-a-date")]), /invalid/);
  assert.throws(() => evaluatePackageCompletion(profile, [attempt("normalized-date", "2026-02-30T00:00:00.000Z")]), /invalid/);
  assert.throws(() => evaluatePackageCompletion(profile, [attempt("bad-result", "2026-01-03T00:00:00.000Z", "correct", { result: { kind: "correct", earnedPoints: 0, maxPoints: 1 } })]), /invalid/);
});

test("same instant ordering is stable by id", () => {
  const strict = { ...profile, completionRule: createPackageCompletionRuleV1({ ruleVersion: 1, minimumAttemptCount: 2, rollingWindowSize: 1, qualityThreshold: 1 }) };
  assert.equal(evaluatePackageCompletion(strict, [attempt("z", "2026-01-01T00:00:00.000Z", "correct"), attempt("a", "2026-01-01T00:00:00.000Z", "incorrect")]).kind, "completed");
});
