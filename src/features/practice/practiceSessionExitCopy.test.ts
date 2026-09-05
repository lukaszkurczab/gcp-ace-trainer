import assert from "node:assert/strict";
import test from "node:test";

import type { TrackId } from "../../domain";
import { getPracticeSessionExitCopy } from "./practiceSessionExitCopy";

const partialSummary = {
  description: "Pause to continue later, or end the session to see a partial summary. Saved answers remain available.",
  destructiveLabel: "End and view summary",
};
const abandonToPractice = {
  description: "Pause to continue later. If you end the session, you will return to Practice and cannot resume it.",
  destructiveLabel: "End session",
};

test("every active track has the contract-defined Practice exit copy", () => {
  const cases: readonly Readonly<{ expected: Readonly<{ description: string; destructiveLabel: string }>; trackId: TrackId }>[] = [
    { expected: partialSummary, trackId: "coding-interview-dsa-problem-solving" },
    { expected: abandonToPractice, trackId: "backend-system-design-interview" },
    { expected: abandonToPractice, trackId: "object-oriented-design-interview" },
    { expected: abandonToPractice, trackId: "frontend-system-design-interview" },
    { expected: abandonToPractice, trackId: "google-cloud-associate-cloud-engineer" },
    { expected: abandonToPractice, trackId: "aws-certified-solutions-architect-associate" },
    { expected: abandonToPractice, trackId: "microsoft-azure-administrator-associate-az-104" },
    { expected: abandonToPractice, trackId: "microsoft-azure-ai-fundamentals-ai-901" },
    { expected: abandonToPractice, trackId: "claude-certified-architect-professional-certification" },
  ];

  for (const { expected, trackId } of cases) {
    assert.deepEqual(getPracticeSessionExitCopy(trackId), expected, trackId);
    assert.equal(Object.isFrozen(getPracticeSessionExitCopy(trackId)), true, trackId);
  }
});

test("Practice exit rejects missing and unknown track identities without a fallback", () => {
  assert.throws(
    () => getPracticeSessionExitCopy(undefined),
    /Practice exit requires an exact supported track identity\./u,
  );
  assert.throws(
    () => getPracticeSessionExitCopy("missing-track" as TrackId),
    /Unknown track id: missing-track/u,
  );
});
