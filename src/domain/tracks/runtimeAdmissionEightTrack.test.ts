import assert from "node:assert/strict";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import type { AlgorithmQuestion } from "../../tracks/coding-interview/algorithmQuestionTypes";
import type { CertificationQuestion } from "../../tracks/certification/domain";
import type { DesignQuestion } from "../../tracks/design-interview";
import { getTracks } from "..";

const NOW = "2026-08-21T10:00:00.000Z";
const RELEASE_ID = "patternly-launch-2026-08-25-01";

test("runtime admission proves exact package resolution and one valid lifecycle step for all eight tracks", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();

  for (const registration of getTracks()) {
    const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(registration.id, registration.familyId);
    assert.equal(resolved.package.trackId, registration.id);
    assert.equal(resolved.package.familyId, registration.familyId);
    assert.equal(resolved.package.packagePin.contentReleaseId, RELEASE_ID);

    const modeId = resolved.profile.primaryEntry.modeId;
    const requestedLength = resolved.profile.getMode(modeId).defaultRequestedLength;
    const request = registration.familyId === "coding_interview"
      ? { sessionId: `runtime-admission:${registration.id}`, requestedLength, feedbackMode: "afterEachAnswer", scope: { roadmapNodeId: resolved.profile.freeNodeId } }
      : registration.familyId === "certification"
        ? { sessionId: `runtime-admission:${registration.id}`, requestedLength, domain: resolved.profile.freeNodeId }
        : { sessionId: `runtime-admission:${registration.id}`, requestedLength };

    const prepared = await resolved.runtime.prepare({
      trackId: registration.id,
      modeId,
      request,
      attempts: [],
      reviews: [],
      now: NOW,
    });
    assert.equal(prepared.session.packagePin.contentReleaseId, RELEASE_ID);
    assert.ok(prepared.session.actualLength > 0);
    await resolved.runtime.validateResume({ session: prepared.session, draft: prepared.draft });
    assert.ok(await resolved.runtime.queryDashboard({ activeSession: prepared.session, trackId: registration.id, attempts: [], reviews: [], now: NOW }));
    assert.ok(await resolved.runtime.queryProgress({ trackId: registration.id, attempts: [], reviews: [], now: NOW }));
    assert.ok(await resolved.runtime.queryReview({ trackId: registration.id, reviews: [], now: NOW }));

    const item = resolved.profile.getItemById(prepared.firstOccurrence.itemId);
    const submission = await resolved.runtime.submitPractice({
      session: prepared.session,
      response: correctResponse(registration.familyId, item),
      attempts: [],
      reviews: [],
      now: NOW,
    });
    assert.equal(submission.attempt.result.kind, "correct");
    assert.equal(submission.attempt.item.itemId, prepared.firstOccurrence.itemId);
  }
});

function correctResponse(familyId: string, item: unknown): unknown {
  if (familyId === "certification") {
    const question = item as CertificationQuestion;
    return { kind: "option_selection", selectedOptionIds: [...question.correctOptionIds] };
  }
  if (familyId === "coding_interview") {
    const question = item as AlgorithmQuestion;
    const interaction = question.interaction;
    if (interaction.type === "choice") {
      return { kind: "choice", selectedOptionIds: [...interaction.acceptedOptionIds] };
    }
    if (interaction.type === "ordering") {
      return { kind: "ordering", orderedSubgoalIds: [...interaction.canonicalOrder] };
    }
    return {
      kind: "complexity",
      selectedValuesByDimension: Object.fromEntries(
        interaction.checkedDimensions.map((dimension) => [
          dimension,
          interaction.acceptedValuesByDimension[dimension]![0]!,
        ]),
      ),
    };
  }
  const question = item as DesignQuestion;
  if (question.interaction.type === "choice") {
    return { kind: "choice", selectedOptionIds: [...question.interaction.acceptedOptionIds] };
  }
  if (question.interaction.type === "ordering") {
    return { kind: "ordering", orderedElementIds: [...question.interaction.canonicalOrder] };
  }
  return {
    kind: "decision_matrix",
    selectedValueIdsByDimension: Object.fromEntries(
      question.interaction.dimensions.map((dimension) => [dimension.dimensionId, dimension.acceptedValueIds[0]!]),
    ),
  };
}
