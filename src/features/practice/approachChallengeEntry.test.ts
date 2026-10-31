import assert from "node:assert/strict";
import test from "node:test";
import { APPROACH_CHALLENGE_MODE_ID } from "../../tracks/coding-interview/domain/algorithmModes";
import { APPROACH_CHALLENGE_TRACK_ID } from "../../content/canonical/approachChallengeProblem";
import { resolveApproachChallengeEntry } from "./approachChallengeEntry";

test("an explicit history identity reads only that session regardless of active session", async () => {
  for (const active of [
    { trackId: APPROACH_CHALLENGE_TRACK_ID, modeId: APPROACH_CHALLENGE_MODE_ID, status: "active" },
    { trackId: "another-track", modeId: "another-mode", status: "active" },
  ]) {
    const calls: string[] = [];
    const entry = await resolveApproachChallengeEntry({
      requestedSessionId: "saved-session-42",
      loadActiveSession: async () => { calls.push("load-active"); return active; },
      getExactHistory: async (sessionId) => { calls.push(`history:${sessionId}`); return { sessionId }; },
      resumeActiveSession: async () => { calls.push("resume"); },
      readActiveStage: async () => { calls.push("stage"); return { stage: "unexpected" }; },
    });

    assert.deepEqual(entry, { kind: "history", detail: { sessionId: "saved-session-42" } });
    assert.deepEqual(calls, ["history:saved-session-42"]);
  }
});

test("active ACM resumes exact lifecycle state, while another active mode conflicts", async () => {
  const calls: string[] = [];
  const resumed = await resolveApproachChallengeEntry({
    loadActiveSession: async () => ({ trackId: APPROACH_CHALLENGE_TRACK_ID, modeId: APPROACH_CHALLENGE_MODE_ID, status: "active" }),
    getExactHistory: async () => { calls.push("history"); return {}; },
    resumeActiveSession: async () => { calls.push("resume"); },
    readActiveStage: async () => { calls.push("stage"); return { occurrenceId: "saved-occurrence" }; },
  });
  assert.deepEqual(resumed, { kind: "session", stage: { occurrenceId: "saved-occurrence" } });
  assert.deepEqual(calls, ["resume", "stage"]);

  const conflict = await resolveApproachChallengeEntry({
    loadActiveSession: async () => ({ trackId: "another-track", modeId: "legacy", status: "active" }),
    getExactHistory: async () => { throw new Error("must not read history"); },
    resumeActiveSession: async () => { throw new Error("must not resume another mode"); },
    readActiveStage: async () => { throw new Error("must not read another stage"); },
  });
  assert.deepEqual(conflict, { kind: "conflict" });
});
