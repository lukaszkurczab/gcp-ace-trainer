import assert from "node:assert/strict";
import test from "node:test";
import { isAccountWireState } from "./accountWireState";

const trackId = "claude-certified-architect-professional-certification";
const sha = "a".repeat(64);
const result = (overrides: Record<string, unknown> = {}) => ({
  id: "result-1", sessionId: "session-1", trackId, totalOccurrences: 1,
  answeredOccurrenceIds: [], unansweredOccurrenceIds: ["occ-1"],
  completedAt: "2026-10-26T12:00:00.000Z",
  evidence: { familyId: "certification", details: {
    activeForegroundMs: 1, correctCount: 0, partialCount: 0, incorrectCount: 0,
    pointsEarned: 0, maxPoints: 1, profileId: "claude-certified-architect-professional-certification-patternly-practice-v2", profileVersion: "2",
    scoringPolicyId: "patternly-ccarp-complete-item-v1", scoringPolicyVersion: "1",
    partialResponsesByOccurrenceId: { "occ-1": { type: "choice_multiple", optionIds: ["opt-a"] } },
  } },
  ...overrides,
});

test("account wire accepts immutable CCARP all-or-zero scoring evidence with a valid partial draft", () => {
  assert.equal(isAccountWireState("training_session_result", "result-1", trackId, result()), true);
});

test("account wire preserves an explicit negative matrix value as a selected choice", () => {
  const value = result() as Record<string, any>;
  value.evidence.details.partialResponsesByOccurrenceId = { "occ-1": { type: "decision_matrix", selectedValueIdsByDimension: { "statement-1": ["no"] } } };
  assert.equal(isAccountWireState("training_session_result", "result-1", trackId, value), true);
});

test("account wire rejects malformed or mispartitioned CCARP partial evidence", () => {
  const base = result() as Record<string, any>;
  const details = base.evidence.details;
  assert.equal(isAccountWireState("training_session_result", "result-1", trackId, result({ evidence: { familyId: "certification", details: { ...details, partialResponsesByOccurrenceId: { "occ-1": { type: "decision_matrix", selectedValueIdsByDimension: { row: ["yes", "no"] } } } } } })), false);
  assert.equal(isAccountWireState("training_session_result", "result-1", trackId, result({ unansweredOccurrenceIds: [] })), false);
  assert.equal(isAccountWireState("training_session_result", "result-1", trackId, result({ trackId: "other-track" })), false);
  assert.equal(isAccountWireState("training_session_result", "result-1", "google-cloud-associate-cloud-engineer", result()), false);
});

const acmTrackId = "coding-interview-dsa-problem-solving";
const acmModeId = "coding-interview-approach-challenge";
const acmRef = { trackId: acmTrackId, questionId: "q1", contentVersion: "v1", artifactSha256: sha };
const acmAttempt = (modeId = acmModeId, responseType = "approach_choice", override: Record<string, unknown> = {}) => ({
  id: "attempt-1", sessionId: "session-1", trackId: acmTrackId, modeId, occurrenceId: "q1-occurrence", item: acmRef,
  response: responseType === "approach_choice" ? { type: responseType, optionId: "option-a" } : responseType === "choice_single" ? { type: responseType, optionId: "option-a" } : { type: responseType, selectedValueIdsByDimension: { time: ["linear"] } },
  result: { kind: "partial", earnedPoints: 0, maxPoints: 1 }, reviewEvidence: { sourceItem: acmRef, taxonomyOrSkillRefs: [] },
  answeredAt: "2026-10-30T12:00:00.000Z", committedAt: "2026-10-30T12:00:00.000Z", ...override,
});
const acmResult = (track = acmTrackId, family = "coding_interview", details: Record<string, unknown> = {}) => ({
  id: "result-1", sessionId: "session-1", trackId: track, totalOccurrences: 2, answeredOccurrenceIds: ["q1", "q2"], unansweredOccurrenceIds: [],
  completedAt: "2026-10-30T12:00:00.000Z", evidence: { familyId: family, details: {
    activeForegroundMs: 1, correctCount: 1, partialCount: 1, incorrectCount: 0, pointsEarned: 1, maxPoints: 2,
    modeId: acmModeId, manifestVersion: 1, problemCount: 1, ...details,
  } },
});

test("account wire retains ACM stage responses and zero-point partials only on the exact Coding mode", () => {
  assert.equal(isAccountWireState("training_attempt", "attempt-1", acmTrackId, acmAttempt()), true);
  assert.equal(isAccountWireState("training_attempt", "attempt-1", acmTrackId, acmAttempt(acmModeId, "complexity")), true, "Q2 complexity response remains accepted under the same mode discriminator");
  assert.equal(isAccountWireState("training_attempt", "attempt-1", acmTrackId, acmAttempt("coding-interview-guided-practice", "approach_choice")), false);
  assert.equal(isAccountWireState("training_attempt", "attempt-1", "other-track", acmAttempt(acmModeId, "approach_choice", { trackId: "other-track", item: { ...acmRef, trackId: "other-track" }, reviewEvidence: { sourceItem: { ...acmRef, trackId: "other-track" }, taxonomyOrSkillRefs: [] } })), false, "wrong-track Q1 is rejected");
  assert.equal(isAccountWireState("training_attempt", "attempt-1", "other-track", acmAttempt(acmModeId, "choice_single", { trackId: "other-track", item: { ...acmRef, trackId: "other-track" }, reviewEvidence: { sourceItem: { ...acmRef, trackId: "other-track" }, taxonomyOrSkillRefs: [] } })), false, "wrong-track Q2 is rejected even though its response is choice_single");
  assert.equal(isAccountWireState("training_session_result", "result-1", acmTrackId, acmResult()), true);
  assert.equal(isAccountWireState("training_session_result", "result-1", "other-track", acmResult("other-track")), false);
  assert.equal(isAccountWireState("training_session_result", "result-1", acmTrackId, acmResult(acmTrackId, "design_interview")), false);
  assert.equal(isAccountWireState("training_session_result", "result-1", acmTrackId, acmResult(acmTrackId, "coding_interview", { problemCount: undefined })), false, "incomplete ACM result metadata is rejected");
  assert.equal(isAccountWireState("training_session_result", "result-1", trackId, result()), true, "legacy CCARP wire state remains accepted");
});
