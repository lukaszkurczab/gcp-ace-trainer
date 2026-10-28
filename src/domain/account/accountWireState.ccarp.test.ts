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
