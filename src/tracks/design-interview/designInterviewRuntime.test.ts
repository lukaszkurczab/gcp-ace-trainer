import assert from "node:assert/strict";
import test from "node:test";

import { DesignInterviewFamilyRuntime } from "../../application/design-interview/DesignInterviewFamilyRuntime";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { createDesignPackageRuntimeCatalog } from "../../content/application";
import { scoreDesignQuestion } from "./";
import type { DesignQuestion } from "./";

const NOW = "2026-08-21T10:00:00.000Z";
const DESIGN_TRACKS = [
  "backend-system-design-interview",
  "frontend-system-design-interview",
  "object-oriented-design-interview",
] as const;

function correctResponse(question: DesignQuestion) {
  if (question.interaction.type === "choice") return { kind: "choice" as const, selectedOptionIds: [...question.interaction.acceptedOptionIds] };
  if (question.interaction.type === "ordering") return { kind: "ordering" as const, orderedElementIds: [...question.interaction.canonicalOrder] };
  return {
    kind: "decision_matrix" as const,
    selectedValueIdsByDimension: Object.fromEntries(question.interaction.dimensions.map((dimension) => [dimension.dimensionId, dimension.acceptedValueIds[0]!])),
  };
}

test("Design Interview runtime prepares, submits, and finalizes one immutable session for every installed track", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();

  for (const trackId of DESIGN_TRACKS) {
    const resolved = contentPackageRuntimeOwner.getPreparedDiscovery(trackId);
    assert.equal(resolved.package.familyId, "design_interview");
    const catalog = createDesignPackageRuntimeCatalog(resolved.package);
    const runtime = new DesignInterviewFamilyRuntime(catalog, resolved.package.taxonomyVersion);
    const prepared = await runtime.prepare({
      trackId,
      modeId: "design-interview-learn-framework",
      request: { sessionId: `design-runtime-${trackId}`, requestedLength: 1 },
      attempts: [],
      reviews: [],
      now: NOW,
    });
    const question = catalog.getItemById(prepared.firstOccurrence.itemId);
    const submission = await runtime.submitPractice({ session: prepared.session, response: correctResponse(question), attempts: [], reviews: [], now: NOW });
    assert.equal(submission.attempt.result.kind, "correct");
    const finalized = await runtime.finalizePractice({ session: prepared.session, attempts: [submission.attempt], now: NOW });
    assert.equal(finalized.session.status, "completed");
    assert.equal(finalized.result.totalOccurrences, 1);
  }
});

test("Design Interview scoring covers choice, ordering, and decision matrix interactions from the installed frontend package", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const resolved = contentPackageRuntimeOwner.getPreparedDiscovery("frontend-system-design-interview");
  assert.equal(resolved.package.familyId, "design_interview");
  const catalog = createDesignPackageRuntimeCatalog(resolved.package);

  for (const interactionType of ["choice", "ordering", "decision_matrix"] as const) {
    const question = catalog.getItems().find((candidate) => candidate.interaction.type === interactionType);
    assert.ok(question, `Installed frontend package is missing ${interactionType} interaction coverage.`);
    assert.equal(scoreDesignQuestion(question, correctResponse(question)).kind, "correct");
  }
});

