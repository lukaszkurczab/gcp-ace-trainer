import assert from "node:assert/strict";
import test from "node:test";

import { composeTrainingLifecycleUseCases } from "../../application/bootstrap";
import {
  completeDesignInterviewPracticeSession,
  getDesignInterviewPracticeProjection,
  openDesignInterviewPracticeSession,
  submitDesignInterviewPracticeResponse,
} from "../../application/design-interview";
import { getTrainingAttempts, getTrainingSessionResult } from "../../storage/repositories";
import type { DesignQuestion } from "./";
import { prepareBundledTestPackages } from "../../testing/contentPackageRuntimeTestSupport";
import { installMemoryStorage } from "../../testing/journalTestSupport";

function correctResponse(question: DesignQuestion) {
  if (question.interaction.type === "choice") return { kind: "choice" as const, selectedOptionIds: [...question.interaction.acceptedOptionIds] };
  if (question.interaction.type === "ordering") return { kind: "ordering" as const, orderedElementIds: [...question.interaction.canonicalOrder] };
  return {
    kind: "decision_matrix" as const,
    selectedValueIdsByDimension: Object.fromEntries(question.interaction.dimensions.map((dimension) => [dimension.dimensionId, dimension.acceptedValueIds[0]!])),
  };
}

test("Design Interview lifecycle persists an answer, resumes the exact session, and completes with a verified result", async () => {
  await prepareBundledTestPackages();
  installMemoryStorage();
  composeTrainingLifecycleUseCases({
    wallClock: { now: () => "2026-08-21T10:00:00.000Z" },
    sessionIds: { async create() { return "design-lifecycle-session"; } },
  });

  const opened = await openDesignInterviewPracticeSession({
    trackId: "frontend-system-design-interview",
    modeId: "design-interview-learn-framework",
    requestedLength: 1,
  });
  assert.equal(opened.kind, "ready");
  if (opened.kind !== "ready") return;

  await submitDesignInterviewPracticeResponse(correctResponse(opened.projection.question));
  const afterSubmit = await getDesignInterviewPracticeProjection();
  assert.equal(afterSubmit.response?.source, "materialized");
  assert.equal((await getTrainingAttempts()).value.length, 1);

  const resumed = await openDesignInterviewPracticeSession({
    trackId: "frontend-system-design-interview",
    modeId: "design-interview-learn-framework",
    requestedLength: 1,
    expectedSessionId: opened.projection.session.id,
  });
  assert.equal(resumed.kind, "ready");
  if (resumed.kind !== "ready") return;
  assert.equal(resumed.projection.session.id, opened.projection.session.id);
  assert.equal(resumed.projection.occurrenceId, opened.projection.occurrenceId);
  assert.equal(resumed.projection.response?.source, "materialized");

  const completed = await completeDesignInterviewPracticeSession();
  assert.equal(completed.kind, "verified");
  if (completed.kind === "verified") assert.equal(completed.value.result.sessionId, opened.projection.session.id);
  assert.ok(await getTrainingSessionResult(opened.projection.session.id));
});
